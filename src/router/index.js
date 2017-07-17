import Vue from 'vue'
import Router from 'vue-router'
import ProofOfStake from '@/components/ProofOfStake'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Proof of Stake',
      component: ProofOfStake
    }
  ]
})
