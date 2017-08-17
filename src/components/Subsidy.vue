<template>
  <div v-if="bestBlock" class="container-fluid">

    <div class="row">
      <div class="col-12 mb-2">
        <h5 class="text-center">Decred Supply Distribution</h5>
        <div class="percent-mined">
          <div class="row">
            <div class="col-6 bar-label">
              <small>{{ percentMined | currency('',1) }}% mined</small><br>
              {{ supply | currency('',0) }} DCR
            </div>
            <div class="col-6 text-right bar-label">
              <small>of total</small><br>
              21,000,000 DCR
            </div>
          </div>
          <div class="bar">
            <div
              v-bind:style="{ width: percentMined + '%' }"
              class="filled-bar"
            ></div>
          </div>
          <div>
            <div
              v-bind:style="{ width: percentMined / 2 + '%' }"
              class="vertical-connector"
            ></div>
          </div>
          <div class="hortizontal-connector"></div>
          <div class="subsidy-breakdown flex">
            <div v-bind:style="{ width: airDropPercent + '%' }" class="subsidy-chunk airdrop-color airdrop">
              <span class="subsidy-chunk-label">{{airDropPercent | currency('',1) }}%</span>
            </div>
            <div v-bind:style="{ width: devPreminePercent + '%' }" class="subsidy-chunk dev-premine-color">
              <span class="subsidy-chunk-label">{{devPreminePercent | currency('',1) }}%</span>
            </div>
            <div v-bind:style="{ width: taxSubsidyPercent + '%' }" class="subsidy-chunk dev-subsidy-color">
              <span class="subsidy-chunk-label">{{taxSubsidyPercent | currency('',1) }}%</span>
            </div>
            <div v-bind:style="{ width: voteSubsidyPercent + '%' }" class="subsidy-chunk pos-subsidy-color">
              <span class="subsidy-chunk-label">{{voteSubsidyPercent | currency('',1) }}%</span>
            </div>
            <div v-bind:style="{ width: workSubsidyPercent + '%' }" class="subsidy-chunk pow-subsidy-color pow-subsidy">
              <span class="subsidy-chunk-label">{{workSubsidyPercent | currency('',1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <h5 class="text-center">Block Reward and Total Supply over Time</h5>
      </div>
    </div>
    <div class="row mb-2">
      <div class="legend flex mx-auto">
        <div class="legend-item">
          <span class="swatch airdrop-color"></span>
          Airdrop
        </div>
        <div class="legend-item">
          <span class="swatch dev-premine-color"></span>
          Premine
        </div>
        <div class="legend-item">
          <span class="swatch dev-subsidy-color"></span>
          Development
        </div>
        <div class="legend-item">
          <span class="swatch pos-subsidy-color"></span>
          Proof of Stake
        </div>
        <div class="legend-item">
          <span class="swatch pow-subsidy-color"></span>
          Proof of Work
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-6 col-sm-8 col-mg-9 col-lg-10"></div>
      <div class="col-6 col-sm-4 col-md-3 col-lg-2">
        <div class="row">
          <div class="pos-abs full-width doughnut-wrapper" v-if="currentSubsidyOptions">
            <div class="labels" v-bind:class="{ show: currentSubsidyRange }">
              <span class="label total">{{ totalSubsidyInDCR | currency('',1) }}<br><small class="dcr">DCR</small></span>
              <span class="label work">{{ workSubsidyInDCR | currency('',1) }}</span>
              <span class="label vote">{{ voteSubsidyInDCR | currency('',1) }}</span>
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
                      '#d431e4',
                      '#81ece6',
                      '#e1bd30'
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
                    yAxisID: 'y-axis-0',
                    backgroundColor: '#2ed8a3',
                    borderColor: '#2ed8a3',
                    fill: false,
                    bezierCurve : false,
                    data: subsidyRange,
                  },
                  {
                    label: 'DCR Created',
                    yAxisID: 'y-axis-1',
                    backgroundColor: '#4480fd',
                    borderColor: '#a0bfff',
                    fill: true,
                    bezierCurve: false,
                    data: dcrCreatedRange,
                  }
                ],
                lineAtIndex: [bestBlockIndex]
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
import moment from 'moment'
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

const firstBlockUnixTime = 1454954400
const estimatedDate = (height) => moment
                                    .unix(firstBlockUnixTime + (height * 5 * 60))
                                    .format('l')

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
    currentSubsidyOptions: {
      legend: {
        display: false
      },
      tooltips: {
        enabled: false
      }
    }
  }
}

const customTooltipCallback = _.debounce((d, context) => {
  if (!d.body) {
    context.selectedSubsidy = null
    context.selectedSupply = null
    context.selectedBlockDate = null
  } else {
    context.height = parseInt(d.dataPoints[0].xLabel)
    context.selectedSubsidy = calcBlockSubsidy(context.height)
    if (context.height < context.bestBlock.height) {
      context.selectedBlockDate = estimatedDate(60000)
    } else {
      context.selectedBlockDate = estimatedDate(context.height)
    }
  }
}, 300, {
  leading: true,
  trailing: true
})

function getSubsidyRange (start, end, context) {
  if (start > end) return {}
  let startInterval = parseInt(start / subsidyParams.SubsidyReductionInterval)
  let endInterval = parseInt(end / subsidyParams.SubsidyReductionInterval)
  let iterations = endInterval - startInterval
  if (iterations > 1000) {
    log.info('pick a smaller range')
    return {}
  }
  let subsidyRange = _.times(iterations, (n) => {
    if (n === 0) {
      return calcBlockSubsidy(start)
    } else {
      return calcBlockSubsidy(start + (n * subsidyParams.SubsidyReductionInterval))
    }
  })

  let dcrCreatedRange = [168000000000000]
  _.each(subsidyRange, (subsidy, i) => {
    let subsidyCreatedInInterval = subsidy * subsidyParams.SubsidyReductionInterval
    if (i > 0) {
      dcrCreatedRange.push(dcrCreatedRange[i - 1] + subsidyCreatedInInterval)
    }
  })
  return {
    subsidyRange: subsidyRange,
    subsidyRangeLabels: _.times(iterations, (n) => {
      return start + (n * subsidyParams.SubsidyReductionInterval)
    }),
    dcrCreatedRange: dcrCreatedRange,
    subsidyRangeOptions: {
      legend: {
        display: false
      },
      animation: {
        duration: 2000
      },
      responsive: true,
      maintainAspectRatio: false,
      tooltips: {
        enabled: true,
        callbacks: {
          title: function (tooltipItems, data) {
            let height = parseInt(parseInt(tooltipItems[0].xLabel))
            context.selectedHeight = height
            context.selectedSupply = getSupplyAtHeight(
              context.dcrCreatedRange,
              height,
              context.currentSubsidy,
              context
            )
            return 'Block Height: ' + height
          },
          label: function (tooltipItem, data) {
            if (tooltipItem.datasetIndex === 0) {
              return 'Block  Reward: ' + (Math.round((tooltipItem.yLabel / 100000000) * 100) / 100).toLocaleString() + ' DCR'
            } else {
              return 'Total Mined: ' + (Math.round((tooltipItem.yLabel / 100000000) * 100) / 100) + ' DCR'
            }
          },
          footer: function (tooltipItem, data) {
            return 'Estimated Date: ' + estimatedDate(parseInt(tooltipItem[0].xLabel))
          }
        },
        custom: function (d) {
          customTooltipCallback(d, context)
        }
      },
      scales: {
        yAxes: [
          {
            position: 'left',
            id: 'y-axis-0',
            ticks: {
              beginAtZero: false,
              callback: function (label, index, labels) {
                return (label / 100000000).toLocaleString()
              }
            },
            scaleLabel: {
              labelString: 'Decred created per Block',
              display: true
            }
          },
          {
            position: 'right',
            id: 'y-axis-1',
            ticks: {
              beginAtZero: true,
              callback: function (label, index, labels) {
                return (label / 100000000).toLocaleString()
              }
            },
            scaleLabel: {
              labelString: 'Total DCR created',
              display: true
            }
          }
        ]
      }
    }
  }
}

function getSupplyAtHeight (dcrCreatedRange, height, subsidy, context) {
  let nearestReductionInterval = Math.floor(height / subsidyParams.SubsidyReductionInterval)
  let blocksSinceReductionInterval = height - (nearestReductionInterval * subsidyParams.SubsidyReductionInterval)
  let subsidySinceReductionInterval = blocksSinceReductionInterval * subsidy
  return (dcrCreatedRange[nearestReductionInterval] + subsidySinceReductionInterval) / 100000000
}

export default {
  data () {
    return {
      loading: false,
      error: null,
      currentSupply: null,
      currentSubsidy: null,
      currentBlockDate: null,
      currentSubsidyRange: null,
      currentSubsidyLabels: null,
      currentSubsidyOptions: null,
      start: null,
      end: null,
      subsidyRange: null,
      subsidyRangeLabels: null,
      subsidyRangeOptions: null,
      selectedHeight: null,
      selectedBlock: null,
      selectedSubsidy: null,
      selectedBlockDate: null,
      selectedSupply: null,
      bestBlockIndex: null
    }
  },
  components: {
    LineChart,
    DoughnutChart,
    Loader
  },
  created () {
    this.$store.dispatch('getBestBlock').then((d) => {
      this.selectedBlock = this.$store.state.bestBlock.height
      this.selectedSubsidy = this.$store.state.bestBlock.subsidy
      this.currentBlockDate = estimatedDate(this.$store.state.bestBlock.height)
      this.start = Math.max(0, this.$store.state.bestBlock.height - (50 * subsidyParams.SubsidyReductionInterval))
      this.end = this.$store.state.bestBlock.height + (80 * subsidyParams.SubsidyReductionInterval)
      _.assign(this, getSubsidyRange(this.start, this.end, this))
      _.assign(this, getCurrentSubsidy(this.$store.state.bestBlock.height))
      this.bestBlockIndex = _.indexOf(this.subsidyRange, this.currentSubsidy)
      this.currentSupply = getSupplyAtHeight(
        this.dcrCreatedRange,
        this.$store.state.bestBlock.height,
        this.currentSubsidy,
        this
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
    percentMined () {
      return ((this.selectedSupply || this.currentSupply) / 21000000) * 100
    },
    totalSubsidyInDCR () {
      return (this.selectedSubsidy || this.currentSubsidy) / 100000000
    },
    workSubsidyInDCR () {
      return (this.selectedSubsidy || this.currentSubsidy) * 0.000000006
    },
    voteSubsidyInDCR () {
      return (this.selectedSubsidy || this.currentSubsidy) * 0.000000003
    },
    voteSubsidyPerTicketInDCR () {
      return (this.selectedSubsidy || this.currentSubsidy) * 0.000000003 * 0.2
    },
    taxSubsidyInDCR () {
      return (this.selectedSubsidy || this.currentSubsidy) * 0.000000001
    },
    supply () {
      return this.selectedSupply || this.currentSupply
    },
    airDropPercent () {
      return (840000 / (this.selectedSupply || this.currentSupply) * 100)
    },
    devPreminePercent () {
      return (840000 / (this.selectedSupply || this.currentSupply) * 100)
    },
    workSubsidyPercent () {
      let supply = this.selectedSupply || this.currentSupply
      let mined = supply - 1680000
      return (mined * 0.6 / supply) * 100
    },
    voteSubsidyPercent () {
      let supply = this.selectedSupply || this.currentSupply
      let mined = supply - 1680000
      return (mined * 0.3 / supply) * 100
    },
    taxSubsidyPercent () {
      let supply = this.selectedSupply || this.currentSupply
      let mined = supply - 1680000
      return (mined * 0.1 / supply) * 100
    },
    blockDate () {
      return this.selectedBlockDate || this.currentBlockDate
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
  z-index: 1;
  /*padding: 0 10px 0 0;*/
  top: 142px;
  right: 123px;
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
  color: #fff;
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

.bar {
  background: #dfdfdf;
  border-radius: 10px;
  height: 16px;
  position: relative;
  margin-bottom: 0px;
}
.filled-bar {
  position: absolute;
  background: #4480fd;
  height: 16px;
  border-radius: 10px;
  transition: 1s width;
}
.bar-label {
  line-height: 16px;
  margin-bottom: 4px;
}
.vertical-connector {
  transition: 1s width;
  border-right: 2px solid #cacbcd;
  height: 20px;
}
.hortizontal-connector {
  border: 2px solid #cacbcd;
  border-bottom: 0px;
  height: 20px;
}
.subsidy-breakdown {
  margin-bottom: 10px;
}
.subsidy-chunk {
  transition: 1s width;
  height: 16px;
  text-align: center;
}
.subsidy-chunk-label {
  font-size: 11.5px;
  text-shadow: 0px -1px 1px rgba(255, 255, 255, 0.42);
  color: black;
  vertical-align: top;
}
.airdrop-color {
  background: #57ed85;
}
.airdrop {
  border-radius: 10px 0 0 10px;
}
.dev-premine-color {
  background: #d46769;
}
.dev-subsidy-color {
  background: #e1bd30;
}
.pos-subsidy-color {
  background: #81ece6;
}
.pow-subsidy-color {
  background: #d431e4;
}
.pow-subsidy {
  border-radius: 0 10px 10px 0;
}
.legend {
  font-size: 12px;
}
.legend-item {
  margin-right: 10px;
}
.legend .swatch {
  vertical-align: middle;
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 1px solid #e3e3e3;
}
</style>
