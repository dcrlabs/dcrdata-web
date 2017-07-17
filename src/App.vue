<template>
  <div id="app">
    <img class="logo" src="./assets/logo.svg">
    <router-view></router-view>
  </div>
</template>

<script>

export default {
  name: 'app',
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

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 10px;
}
.logo {
  width: 240px;
}
</style>
