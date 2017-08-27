import moment from 'moment'

module.exports = {
  apiUrl: (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:7777/api/' : 'https://dcrdata.ssgen.io/api/'),
  formatUnixDate: (unixTimestamp, formatPattern) => {
    return moment.unix(unixTimestamp).format(formatPattern)
  },
  formatBytes: (bytes, decimals) => {
    if (bytes === 0) return '0 Bytes'
    var k = 1000
    var dm = decimals || 2
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    var i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
}
