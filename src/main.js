// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Vue2Filters from 'vue2-filters'
import VeeValidate from 'vee-validate'
import log from 'loglevel'

log.setDefaultLevel((process.env.NODE_ENV === 'development') ? 'warn' : 'info')
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})

Vue.use(Vue2Filters)
Vue.use(VeeValidate)
