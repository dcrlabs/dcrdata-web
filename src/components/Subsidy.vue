<template>
  <div v-if="bestBlock" class="container-fluid">

    <div class="row">
      <div class="col-3">
        <dl>
          <dt>Current Block Reward</dt>
          <dd>{{ totalSubsidyInDCR | currency('',2) }} DCR</dd>
        </dl>
      </div>
      <div class="col-3">
        <dl>
          <dt>Proof of Work Reward</dt>
          <dd>
            {{ workSubsidyInDCR | currency('',2) }} DCR
          </dd>
        </dl>
      </div>
      <div class="col-3">
        <dl>
          <dt>Proof of Stake Reward</dt>
          <dd>
            {{ voteSubsidyInDCR | currency('',2) }} DCR
            <small>( {{ voteSubsidyPerTicketInDCR | currency('',2) }} DCR / ticket )</small>
          </dd>
        </dl>
      </div>
      <div class="col-3">
        <dl>
          <dt>Developement Tax</dt>
          <dd>{{ taxSubsidyInDCR | currency('',2) }} DCR</dd>
        </dl>
      </div>
    </div>


    <div class="row">

      <div class="col-md-12">
        <div class="pos-rel chart-wrapper">
          <div v-if="subsidyRange">
            <line-chart
              :height="400"
              :chart-data="{
                labels: subsidyRangeLabels,
                datasets:[
                  {
                    label: 'Block Reward',
                    backgroundColor: '#2ed8a3',
                    borderColor: '#2ed8a3',
                    fill: false,
                    bezierCurve : false,
                    data: subsidyRange
                  }
                ]
              }"
              :options="subsidyRangeOptions"
            ></line-chart>

          </div>
          <div v-if="!subsidyRange" class="chart-loader">
            <loader></loader>
            Loading data...
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
// import axios from 'axios'
// import moment from 'moment'
import helpers from '../helpers'
// import chartData from '../chartData'
import LineChart from '@/components/LineChart.js'
import Loader from '@/components/Loader.vue'
import _ from 'lodash'
import log from 'loglevel'

const subsidyParams = {
  BaseSubsidy: 3119582664, // 21m
  MulSubsidy: 100,
  DivSubsidy: 101,
  SubsidyReductionInterval: 6144,
  WorkRewardProportion: 6,
  StakeRewardProportion: 3,
  BlockTaxProportion: 1
}
function calcBlockSubsidy (height) {
  let reductionIntervals = parseInt(height / subsidyParams.SubsidyReductionInterval)
  let subsidy = subsidyParams.BaseSubsidy
  _.times(reductionIntervals, (n) => {
    subsidy = reducedSubsidy(subsidy)
  })
  return subsidy
}

function reducedSubsidy (subsidy) {
  return parseInt(
    parseInt(subsidy * subsidyParams.MulSubsidy) / subsidyParams.DivSubsidy
  )
}

function getSubsidy (start, end) {
  if (start > end) return {}
  let startInterval = parseInt(start / subsidyParams.SubsidyReductionInterval)
  let endInterval = parseInt(end / subsidyParams.SubsidyReductionInterval)
  let iterations = endInterval - startInterval
  if (iterations > 1000) {
    console.log('pick a smaller range')
    return {}
  }
  return {
    subsidyRange: _.times(iterations, (n) => {
      if (n === 1) {
        return calcBlockSubsidy(start)
      } else {
        return calcBlockSubsidy(start + ((n) * subsidyParams.SubsidyReductionInterval))
      }
    }),
    subsidyRangeLabels: _.times(iterations, (n) => {
      return start + ((n) * subsidyParams.SubsidyReductionInterval)
    }),
    subsidyRangeOptions: {
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
            return (Math.round((tooltipItem.yLabel / 100000000) * 100) / 100) + ' DCR'
          }
        }
      },
      scales: {
        yAxes: [
          {
            position: 'left',
            id: 'y-axis-0',
            ticks: {
              beginAtZero: true,
              callback: function (label, index, labels) {
                return (label / 100000000).toLocaleString()
              }
            },
            scaleLabel: {
              labelString: 'Decred created per Block',
              display: true
            }
          }
        ]
      }
    }
  }
}

export default {
  data () {
    return {
      loading: false,
      error: null,
      currentSubsidy: null,
      start: 0,
      end: 2000000,
      subsidyRange: null,
      subsidyRangeLabels: null,
      subsidyRangeOptions: null
    }
  },
  components: {
    LineChart,
    Loader
  },
  created () {
    log.info('overview')
    this.$store.dispatch('getBestBlock').then((d) => {
      var _this = this
      _this.currentSubsidy = calcBlockSubsidy(this.$store.state.bestBlock.height)
      console.log('getSubsidy(this.start, this.end)', getSubsidy(this.start, this.end))
      _.assign(this,
        getSubsidy(this.start, this.end)
      )
    })
  },
  watch: {
  },
  filters: {
    formatUnixDate: helpers.formatUnixDate
  },
  computed: {
    bestBlock () {
      return this.$store.state.bestBlock
    },
    totalSubsidyInDCR () {
      return this.currentSubsidy / 100000000
    },
    workSubsidyInDCR () {
      return this.currentSubsidy * 0.000000006
    },
    voteSubsidyInDCR () {
      return this.currentSubsidy * 0.000000003
    },
    voteSubsidyPerTicketInDCR () {
      return this.currentSubsidy * 0.000000003 * 0.2
    },
    taxSubsidyInDCR () {
      return this.currentSubsidy * 0.000000001
    }
  },
  methods: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
dt {
  font-weight: 700;
  font-size: 0.76em;
  color: #565656;
}
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
