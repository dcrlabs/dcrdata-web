// import moment from 'moment'
import axios from 'axios'
import _ from 'lodash'
import helpers from './helpers'
import moment from 'moment'
import log from 'loglevel'

const rountToThousand = (value) => { return Math.round(value / 1000) * 1000 }

module.exports = {
  getStakeChartData: (start, end, bestBlock) => {
    var startStep = Math.floor(start / 144) * 144
    let endStep = Math.floor(end / 144) * 144
    let url = helpers.apiUrl + 'block/range/' + startStep + '/' + endStep + '/144'
    return new Promise((resolve, reject) => {
      axios.get(url).then(function (response) {
        let range = _.compact(response.data)
        let latest = []
        let lastDatum = _.last(range)
        let lastTicketWindow = lastDatum.height / 144
        let bestBlockTicketWindow = Math.floor(bestBlock.height / 144)
        if (lastTicketWindow === bestBlockTicketWindow && lastDatum.height < bestBlock.height) {
          latest = [bestBlock]
          range = range.concat(latest)
        }
        let maxSDiff = _.maxBy(range, 'sdiff').sdiff
        let minSDiff = _.minBy(range, 'sdiff').sdiff
        let sDiffDelta = maxSDiff - minSDiff
        let poolSizeByWindow = _.map(range, (d) => {
          return d.ticket_pool.size
        })
        let first = range[0]
        let last = _.last(range)
        let timeDelta = last.time - first.time
        let blockHeightDelta = last.height - first.height
        let avgTimeBlockTime = (timeDelta / blockHeightDelta)
        let avgTimeBlockTimeMoment = moment.utc(avgTimeBlockTime * 1000)
        let formattedAvgTimeBlockTime = avgTimeBlockTimeMoment.format('mm:ss')
        let minPoolsize = _.min(poolSizeByWindow)
        let maxPoolsize = _.max(poolSizeByWindow)
        let poolSizeDelta = maxPoolsize - minPoolsize
        if (poolSizeDelta < 1000) {
          poolSizeDelta = 1001
        }
        let poolSizeYAxisMin = Math.max(rountToThousand(minPoolsize - (poolSizeDelta * 4)), 0)
        let poolSizeYAxisMax = Math.min(rountToThousand(maxPoolsize + (poolSizeDelta * 2)), 60000)
        let ticketPrices = _.map(range, (d) => { return d.sdiff })
        let ticketPoolSizeRangeLabels = _.map(range, (d) => {
          return (d.height / 144).toLocaleString()
        })
        if (latest[0]) {
          ticketPoolSizeRangeLabels[ticketPoolSizeRangeLabels.length - 1] = 'best block'
        }
        let chartData = {
          avgTimeBlockTimeInMinutes: formattedAvgTimeBlockTime,
          ticketPoolSizeRange: poolSizeByWindow,
          ticketPoolSizeRangeLabels: ticketPoolSizeRangeLabels,
          ticketPoolSizeRangeOptions: {
            bezierCurve: false,
            animation: {
              duration: 1000
            },
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
              enabled: true,
              callbacks: {
                title: function (tooltipItems, data, i) {
                  console.log('tooltipItems', tooltipItems, data, i)
                  if (tooltipItems[0].xLabel === 'best block') {
                    return `Best Block: ${bestBlock.height.toLocaleString()}`
                  }
                  return `Ticket Window: ${tooltipItems[0].xLabel}`
                },
                afterTitle: function (tooltipItems, data, i) {
                  let blockHeight = parseInt(tooltipItems[0].xLabel.replace(/,/g, '')) * 144
                  if (tooltipItems[0].xLabel === 'best block') {
                    return
                  } else {
                    return `Blocks:
${blockHeight.toLocaleString()}
—
${(blockHeight + 144).toLocaleString()}`
                  }
                },
                label: function (tooltipItem, data) {
                  if (tooltipItem.datasetIndex === 0) {
                    return tooltipItem.yLabel.toLocaleString() + ' DCR per ticket'
                  } else {
                    return tooltipItem.yLabel.toLocaleString() + ' Tickets in Pool'
                  }
                }
              }
            },
            scales: {
              xAxes: [{
                barPercentage: 1,
                categoryPercentage: 1
              }],
              yAxes: [
                {
                  position: 'right',
                  id: 'y-axis-1',
                  ticks: {
                    min: Math.max((minSDiff - (sDiffDelta * 1)), 0),
                    max: Math.min((maxSDiff + (sDiffDelta * 3)), 280),
                    callback: function (label, index, labels) {
                      return label.toLocaleString()
                    }
                  },
                  scaleLabel: {
                    labelString: 'Ticket Price in DCR',
                    display: true
                  }
                },
                {
                  position: 'left',
                  id: 'y-axis-0',
                  ticks: {
                    min: poolSizeYAxisMin,
                    max: poolSizeYAxisMax,
                    beginAtZero: false,
                    callback: function (label, index, labels) {
                      return label.toLocaleString()
                    }
                  },
                  scaleLabel: {
                    labelString: '# of Tickets',
                    display: true
                  }
                }
              ]
            }
          },
          ticketPrices: ticketPrices
        }
        resolve(chartData)
      })
      .catch(function (error) {
        log.info('fetchBlockRange error', error)
        reject(error)
      })
    })
  }
}
