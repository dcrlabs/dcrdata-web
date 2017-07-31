<template>
  <div v-if="bestBlock" class="container-fluid">

    <div class="row">
      <div class="col-6 col-sm-8 col-mg-9 col-lg-10">
      </div>
      <div class="col-6 col-sm-4 col-md-3 col-lg-2">
        <div class="row"><h3>Block Reward</h3></div>
        <div class="row">
          <div class="pos-abs full-width doughnut-wrapper">
            <div class="labels" v-bind:class="{ show: currentSubsidyRange }">
              <span class="label total">{{ totalSubsidyInDCR | currency('',1) }}<br><small class="dcr">DCR</small></span>
              <span class="label work">{{ workSubsidyInDCR | currency('',1) }}</span>
              <span class="label vote">{{ voteSubsidyInDCR | currency('',1) }}</span>
              <!-- <span class="label ticket">{{ voteSubsidyPerTicketInDCR | currency('',1) }}</span> -->
              <span class="label developement">{{ taxSubsidyInDCR | currency('',1) }}</span>
            </div>
            <doughnut-chart
              :chart-data="{
                labels: [],
                datasets:[
                  {
                    type: 'doughnut',
                    label: 'Block Reward',
                    backgroundColor: [
                      '#69D3F5',
                      '#41bf53',
                      '#fd714a'
                    ],
                    data: currentSubsidyRange
                  }
                ]
              }"
              :options="currentSubsidyOptions"
            ></doughnut-chart>
          </div>
        </div>
      </div>
    </div>

    <div class="row">

      <div class="col-md-12">
        <div class="pos-rel chart-wrapper">
          <div v-if="subsidyRange">
            <line-chart
              :height="500"
              :chart-data="{
                labels: subsidyRangeLabels,
                datasets:[
                  {
                    label: 'Block Reward',
                    backgroundColor: '#2ed8a3',
                    borderColor: '#2ed8a3',
                    fill: false,
                    bezierCurve : false,
                    data: subsidyRange,
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
import DoughnutChart from '@/components/DoughnutChart.js'
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

function getCurrentSubsidy (height) {
  let subsidy = calcBlockSubsidy(height)
  return {
    currentSubsidy: subsidy,
    currentSubsidyRange: [
      subsidy * 0.000000006,
      subsidy * 0.000000003,
      subsidy * 0.000000001
    ],
    currentSubsidyLabels: [
      'Work',
      'Vote',
      'Developement'
    ],
    currentSubsidyOptions: {
      legend: {
        display: true,
        text: 'Block Reward'
      },
      animation: {
        duration: 100
      },
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
      }
    }
  }
}

function getSubsidyRange (start, end) {
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
      currentSubsidyRange: null,
      currentSubsidyLabels: null,
      currentSubsidyOptions: null,
      start: 0,
      end: 2000000,
      subsidyRange: null,
      subsidyRangeLabels: null,
      subsidyRangeOptions: null
    }
  },
  components: {
    LineChart,
    DoughnutChart,
    Loader
  },
  created () {
    log.info('overview')
    this.$store.dispatch('getBestBlock').then((d) => {
      _.assign(this, getSubsidyRange(this.start, this.end))
      _.assign(this, getCurrentSubsidy(this.$store.state.bestBlock.height))
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
.doughnut-wrapper {
  /*padding: 0 10px 0 0;*/
}
.doughnut-wrapper .labels {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity .33s .99s ease-in;
}
.doughnut-wrapper .labels.show {
  opacity: 1;
}
.doughnut-wrapper .label {
  position: absolute;
  font-weight: 600;
  color: #fff;
}
.doughnut-wrapper .total {
  top: 40%;
  left: 0%;
  font-size: 33px;
  width: 100%;
  text-align: center;
  color: #464a4c;
  line-height: 30px;
}
.doughnut-wrapper .total .dcr {
  font-size: 66%;
}
.doughnut-wrapper .work {
  top: 45%;
  right: 8%;
}
.doughnut-wrapper .vote {
  top: 45%;
  left: 10%;
}
.doughnut-wrapper .developement {
  top: 13%;
  left: 33%;
}
a {
  color: #42b983;
}

</style>
