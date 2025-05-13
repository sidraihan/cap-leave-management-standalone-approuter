const cds = require('@sap/cds')

cds.on('bootstrap', app => {
  console.log('✅ Custom server bootstrap loaded')
})

cds.on('served', () => {
  console.log('✅ Services are being served')
})

module.exports = cds.server
