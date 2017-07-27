<template>
  <div class="container-fluid" v-if="bestBlock">

    <div class="row">
      <div class="col-12">
        <h3>Block Size</h3>
      </div>
    </div>

    <div class="pos-rel">
      <div v-if="loading" class="chart-loader">
        <loader></loader>
        Loading data...
      </div>
      <div v-if="blockSizeRange">
        <bar-chart
          :height="400"
          :chart-data="{
            labels: blockSizeRangeLabels,
            datasets:[
              {
                label: 'Block Size',
                yAxisID: 'y-axis-0',
                backgroundColor: '#69D3F5',
                borderColor: '#3bcfff',
                data: blockSizeRange
              }
            ]
          }"
          :options="blockSizeRangeOptions"
        ></bar-chart>
        <div class="text-center" style="margin-top: -5px;"><small>Block Height</small></div>
      </div>
    </div>

  </div>
</template>

<script>

import helpers from '../helpers'
import BarChart from '@/components/BarChart.js'
import Loader from '@/components/Loader.vue'
import axios from 'axios'
import _ from 'lodash'
import log from 'loglevel'

function getTransactions (start, end, data) {
  let url = helpers.apiUrl + 'block/range/' + start + '/' + end
  axios.get(url).then(function (response) {
    var compactedResponseData = _.compact(response.data)
    log.info('compactedResponseData', compactedResponseData)
    let chartData = {
      blockSizeRange: _.map(compactedResponseData, 'size'),
      blockSizeRangeLabels: _.map(compactedResponseData, (v) => {
        return v.height.toLocaleString()
      }),
      blockSizeRangeOptions: {
        animation: {
          duration: 2000
        },
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          enabled: true,
          callbacks: {
            title: function (tooltipItems, data) {
              return 'Block Height: ' + tooltipItems[0].xLabel
            },
            label: function (tooltipItem, data) {
              return helpers.formatBytes(tooltipItem.yLabel)
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
                  return helpers.formatBytes(label)
                }
              },
              scaleLabel: {
                labelString: 'Block Size',
                display: true
              }
            }
          ]
        }
      }
    }
    data.loading = false
    _.assign(data, chartData)
  })
  .catch(function (error) {
    log.info('fetchBlockRange error', error)
    data.loading = false
  })
}

export default {
  data () {
    return {
      loading: true,
      start: null,
      end: null,
      avgTimeBlockTimeInMinutes: null,
      lastBlockTimeElapsed: null,
      blockSizeRange: null,
      blockSizeRangeLabels: null,
      blockSizeRangeOptions: null,
      stakeDiff: null,
      ticketPrices: null,
      error: null
    }
  },
  components: {
    BarChart,
    Loader
  },
  created () {
    var _this = this
    _this.$store.dispatch('getBestBlock').then((bestBlock) => {
      _this.start = bestBlock.height - 12
      _this.end = bestBlock.height
      getTransactions(_this.start, _this.end, _this)
    })
  },
  watch: {
    // call again the method if the route changes
    '$route': 'fetchStarterData'
  },
  filters: {
    formatUnixDate: helpers.formatUnixDate
  },
  computed: {
    bestBlock () {
      return this.$store.state.bestBlock
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.range-input {
  width: 100px;
}
.input-label {
  font-size: 12px;
}
a {
  color: #42b983;
}
</style>
