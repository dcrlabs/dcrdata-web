import Vue from 'vue'
import Router from 'vue-router'
import ProofOfStake from '@/components/ProofOfStake'
import Transactions from '@/components/Transactions'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Proof of Stake',
      component: ProofOfStake
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: Transactions
    }
  ]
})
