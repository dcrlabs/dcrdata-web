// import moment from 'moment'
import axios from 'axios'
import _ from 'lodash'
import helpers from './helpers'
import moment from 'moment'
import log from 'loglevel'
import Lockr from 'lockr'

const rountToThousand = (value) => { return Math.round(value / 5000) * 5000 }

module.exports = {
  getStakeChartData: (start, end, bestBlock) => {
    let url = helpers.apiUrl + 'block/range/' + start + '/' + end
    return new Promise((resolve, reject) => {
      let cacheUrl = url + ':v4:' + bestBlock.height
      let responseData = Lockr.get(cacheUrl)
      if (responseData) {
        resolve(responseData)
      } else {
        axios.get(url).then(function (response) {
          log.info('fetchBlockRange', response)
          let compactedResponseData = _.compact(response.data)
          let blocksByTicketWindow = _.groupBy(compactedResponseData, (d) => {
            return Math.floor(d.height / 144)
          })
          delete blocksByTicketWindow[_.keys(blocksByTicketWindow)[0]]

          let maxSDiff = _(blocksByTicketWindow).map((v, k) => {
            return v[0]
          }).maxBy('sdiff').sdiff
          let minSDiff = _(blocksByTicketWindow).map((v, k) => {
            return v[0]
          }).minBy('sdiff').sdiff
          let sDiffDelta = maxSDiff - minSDiff

          // ticket pool size
          let poolSizeByWindow = _(blocksByTicketWindow)
                                  .mapValues((v) => {
                                    return _.first(v).ticket_pool.size
                                  })
                                  .value()

          log.info('compactedResponseData', compactedResponseData)
          let start = compactedResponseData[0]
          let end = _.last(compactedResponseData)
          let timeDelta = end.time - start.time
          let blockHeightDelta = end.height - start.height
          let avgTimeBlockTime = (timeDelta / blockHeightDelta)
          let avgTimeBlockTimeMoment = moment.utc(avgTimeBlockTime * 1000)
          let formattedAvgTimeBlockTime = avgTimeBlockTimeMoment.format('mm:ss')
          let ticketPoolSizeRange = _.values(poolSizeByWindow)
          let minPoolsize = _.min(ticketPoolSizeRange)
          let maxPoolsize = _.max(ticketPoolSizeRange)
          let poolSizeDelta = maxPoolsize - minPoolsize

          let chartData = {
            avgTimeBlockTimeInMinutes: formattedAvgTimeBlockTime,
            ticketPoolSizeRange: ticketPoolSizeRange,
            ticketPoolSizeRangeLabels: _(blocksByTicketWindow)
              .mapValues((v) => {
                return (_.first(v).height / 144).toLocaleString()
              })
              .values()
              .value(),
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
                    return `Ticket Window: ${tooltipItems[0].xLabel}`
                  },
                  afterTitle: function (tooltipItems, data, i) {
                    let blockHeight = parseInt(tooltipItems[0].xLabel.replace(/,/g, '')) * 144
                    return `Blocks:
${blockHeight.toLocaleString()}
—
${(blockHeight + 144).toLocaleString()}`
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
                      min: Math.max(rountToThousand(minPoolsize - (poolSizeDelta * 4)), 0),
                      max: Math.min(rountToThousand(maxPoolsize + (poolSizeDelta * 2)), 60000),
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
            ticketPrices: _(blocksByTicketWindow)
                            .mapValues((v) => {
                              return _.first(v).sdiff
                            })
                            .values()
                            .value()
          }
          Lockr.set(cacheUrl, chartData)
          resolve(chartData)
        })
        .catch(function (error) {
          log.info('fetchBlockRange error', error)
          reject(error)
        })
      }
    })
  }
}
