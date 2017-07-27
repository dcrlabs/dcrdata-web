<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import store from './store'

export default {
  name: 'app',
  store,
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  }
}
</script>

<style>
.no-wrap {
  white-space: nowrap;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
.logo {
  width: 114px;
}
.logo-text {
  vertical-align: top;
  height: 40px;
  font-size: 20px;
  font-weight: 500;
  position: relative;
  left: -12px;
  top: 4.5px;
}
.main-view {
  padding-top: 1em;
}
.root-loader {
  width: 100%;
  position: absolute;
  height: 10em;
  text-align: center;
  padding: 4em;
}
.chart-loader {
  width: 100%;
  position: absolute;
  height: 20em;
  text-align: center;
  padding: 240px 0 0 0;
}
.pos-rel {
  position: relative;
}
</style>
