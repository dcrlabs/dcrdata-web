<template>
  <div v-if="bestBlock" class="container-fluid">

    <div class="row">
      <div class="col-3">
        <dl>
          <dt>Block Reward</dt>
          <dd>{{ totalSubsidyInDCR | currency('',2) }} DCR</dd>
        </dl>
      </div>
      <div class="col-3">
        <dl>
          <dt>Proof of Work Reward</dt>
          <dd>{{ workSubsidyInDCR | currency('',2) }} DCR</dd>
        </dl>
      </div>
      <div class="col-3">
        <dl>
          <dt>Proof of Stake Reward</dt>
          <dd>{{ voteSubsidyInDCR | currency('',2) }} DCR</dd>
        </dl>
      </div>
      <div class="col-3">
        <dl>
          <dt>Developement Tax</dt>
          <dd>{{ taxSubsidyInDCR | currency('',2) }} DCR</dd>
        </dl>
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
// import _ from 'lodash'
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
  let iteration = parseInt(height / subsidyParams.SubsidyReductionInterval)
  let subsidy = subsidyParams.BaseSubsidy
  for (var i = 0; i < iteration; i++) {
    subsidy = parseInt(subsidy * subsidyParams.MulSubsidy)
    subsidy = parseInt(subsidy / subsidyParams.DivSubsidy)
  }
  return subsidy
}

export default {
  data () {
    return {
      loading: false,
      error: null,
      lastBlockTimeElapsed: null,
      currentSubsidy: null
    }
  },
  components: {
    LineChart
  },
  created () {
    log.info('overview')
    this.$store.dispatch('getBestBlock').then((d) => {
      var _this = this
      _this.currentSubsidy = calcBlockSubsidy(this.$store.state.bestBlock.height)
      setInterval(function () {
        var time = moment.utc(_this.bestBlock.time * 1000)
        _this.lastBlockTimeElapsed = time.fromNow()
      }, 1000)
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
      return this.currentSubsidy / 600000000
    },
    voteSubsidyInDCR () {
      return this.currentSubsidy / 300000000
    },
    taxSubsidyInDCR () {
      return this.currentSubsidy / 1000000000
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
