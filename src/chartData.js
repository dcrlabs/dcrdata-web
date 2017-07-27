// import moment from 'moment'
import axios from 'axios'
import _ from 'lodash'
import helpers from './helpers'
import moment from 'moment'
import log from 'loglevel'
import Lockr from 'lockr'

module.exports = {
  getStakeChartData: (start, end, bestBlock) => {
    let url = helpers.apiUrl + 'block/range/' + start + '/' + end
    return new Promise((resolve, reject) => {
      let cacheUrl = url + ':v1:' + bestBlock.height
      let responseData = Lockr.get(cacheUrl)
      if (responseData) {
        resolve(responseData)
      } else {
        axios.get(url).then(function (response) {
          log.info('fetchBlockRange', response)
          var compactedResponseData = _.compact(response.data)
          var blocksByTicketWindow = _.groupBy(compactedResponseData, (d) => {
            return Math.floor(d.height / 144)
          })
          delete blocksByTicketWindow[_.keys(blocksByTicketWindow)[0]]
          log.info('blocksByTicketWindow', blocksByTicketWindow)

          // ticket pool size
          var poolSizeByWindow = _(blocksByTicketWindow)
                                  .mapValues((v) => {
                                    return _.first(v).ticket_pool.size
                                  })
                                  .value()

          log.info('compactedResponseData', compactedResponseData)
          var start = compactedResponseData[0]
          var end = _.last(compactedResponseData)
          var timeDelta = end.time - start.time
          var blockHeightDelta = end.height - start.height
          var avgTimeBlockTime = (timeDelta / blockHeightDelta)
          var avgTimeBlockTimeMoment = moment.utc(avgTimeBlockTime * 1000)
          var formattedAvgTimeBlockTime = avgTimeBlockTimeMoment.format('mm:ss')
          let chartData = {
            avgTimeBlockTimeInMinutes: formattedAvgTimeBlockTime,
            ticketPoolSizeRange: _.values(poolSizeByWindow),
            ticketPoolSizeRangeLabels: _(blocksByTicketWindow)
              .mapValues((v) => {
                return (_.first(v).height / 144).toLocaleString()
              })
              .values()
              .value(),
            ticketPoolSizeRangeOptions: {
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
                      return tooltipItem.yLabel.toLocaleString() + ' Tickets in Pool'
                    } else {
                      return tooltipItem.yLabel.toLocaleString() + ' DCR per ticket'
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
                    position: 'left',
                    id: 'y-axis-0',
                    ticks: {
                      beginAtZero: false,
                      callback: function (label, index, labels) {
                        return label.toLocaleString()
                      }
                    },
                    scaleLabel: {
                      labelString: '# of Tickets',
                      display: true
                    }
                  },
                  {
                    position: 'right',
                    id: 'y-axis-1',
                    ticks: {
                      callback: function (label, index, labels) {
                        return label.toLocaleString()
                      }
                    },
                    scaleLabel: {
                      labelString: 'Ticket Price in DCR',
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
