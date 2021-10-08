const ip = require('ip')
const dns = require('dns').promises
const isIP = require('isipaddress')
const parseUrl = require('url').parse

module.exports = async function urlIsPrivate(uri) {
  const url = parseUrl(uri, false, true)
  const ipPart = extractIpv4(url.hostname)

  if (isIP.v4(ipPart)) {
    // it's an IPV4 and it's private don't go further
    return IPisPrivate(ipPart)
  }

  const {address} = await dns.lookup(url.hostname)
  return IPisPrivate(address)
}

function extractIpv4(hostname) {
  return String(hostname).split('\\')[0].split(':')[0]
}

function IPisPrivate(ipAddr) {
  return ipAddr === '0.0.0.0' || ip.isPrivate(ipAddr)
}
