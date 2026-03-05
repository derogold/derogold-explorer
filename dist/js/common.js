const localData = {}
const HASH_REGEX = /^[0-9a-fA-F]{64}$/
const DECIMAL_MULTIPLIER = Math.pow(10, ExplorerConfig.decimalPoints)

if (typeof google !== 'undefined') {
  google.charts.load('current', {
    packages: ['corechart']
  })
}

$(document).ready(function () {
  $('#searchButton').click(function () {
    searchForTerm($('#searchValue').val())
  })

  $('#searchValue').keydown(function (e) {
    setSearchValueErrorState(false)
    if (e.which === 13) {
      searchForTerm($('#searchValue').val())
    }
  })

  $('.navbar-burger').click(function () {
    $('.navbar-burger').toggleClass('is-active')
    $('.navbar-menu').toggleClass('is-active')
  })
})

function formatHashRate (hashrate) {
  if (hashrate >= 1e9) {
    return numeral(hashrate / 1e9).format('0,0.00') + ' GH/s'
  } else if (hashrate >= 1e6) {
    return numeral(hashrate / 1e6).format('0,0.00') + ' MH/s'
  } else if (hashrate >= 1e3) {
    return numeral(hashrate / 1e3).format('0,0.00') + ' KH/s'
  } else {
    return numeral(hashrate).format('0,0') + ' H/s'
  }
}

/* Helper for making JSON-RPC 2.0 calls to the local daemon */
function daemonRpc (method, params, successFn, errorFn) {
  $.ajax({
    url: ExplorerConfig.daemonUrl + '/json_rpc',
    dataType: 'json',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: method,
      params: params || {}
    }),
    success: function (response) {
      if (response.error) {
        if (errorFn) errorFn(response.error)
        return
      }
      if (successFn) successFn(response.result)
    },
    error: function (xhr, status, err) {
      if (errorFn) errorFn(err)
    }
  })
}

function checkForSearchTerm () {
  const searchTerm = getQueryStringParam('search')
  /* If we were given a search term, let's plug it in
     and then run a search for them */
  if (searchTerm && searchTerm.length !== 0) {
    $('#searchValue').val(searchTerm)
    searchForTerm(searchTerm)
  }
}

function searchTransactionPool (term) {
  var found = false
  if (localData.transactionPool) {
    /* Clear any highlights */
    localData.transactionPool.rows().every(function (idx, tableLoop, rowLoop) {
      $(localData.transactionPool.row(idx).nodes()).removeClass('is-ours')
    })

    localData.transactionPool.rows().every(function (idx, tableLoop, rowLoop) {
      if (localData.transactionPool.row(idx).data()[3] === term) {
        $(localData.transactionPool.row(idx).nodes()).addClass('is-ours')
        found = true
      }
    })
  }

  return found
}

function isHash (str) {
  return HASH_REGEX.test(str)
}

function getCurrentNetworkHashRateLoop () {
  if (ExplorerConfig.daemonMode) {
    daemonRpc('getlastblockheader', {}, function (result) {
      localData.networkHashRate = Math.floor(result.block_header.difficulty / ExplorerConfig.blockTargetTime)
      $('#globalHashRate').text(formatHashRate(localData.networkHashRate))
      setTimeout(function () {
        getCurrentNetworkHashRateLoop()
      }, 15000)
    }, function () {
      setTimeout(function () {
        getCurrentNetworkHashRateLoop()
      }, 15000)
    })
  } else {
    $.ajax({
      url: ExplorerConfig.apiBaseUrl + '/block/header/top',
      dataType: 'json',
      type: 'GET',
      cache: false,
      success: function (header) {
        localData.networkHashRate = Math.floor(header.difficulty / ExplorerConfig.blockTargetTime)
        $('#globalHashRate').text(formatHashRate(localData.networkHashRate))
        setTimeout(function () {
          getCurrentNetworkHashRateLoop()
        }, 15000)
      },
      error: function () {
        setTimeout(function () {
          getCurrentNetworkHashRateLoop()
        }, 15000)
      }
    })
  }
}

function searchForTerm (term) {
  term = term.trim()
  /* Allow commas in a height search */
  term = term.replace(',', '')

  if (parseInt(term).toString() === term) {
    /* This should be height so we know to perform a search on height */
    if (ExplorerConfig.daemonMode) {
      daemonRpc('getblockheaderbyheight', { height: parseInt(term) }, function (result) {
        window.location = './block.html?hash=' + result.block_header.hash
      }, function () {
        setSearchValueErrorState(true)
      })
    } else {
      $.ajax({
        url: ExplorerConfig.apiBaseUrl + '/block/header/' + term + '?random=' + (new Date()).getTime(),
        dataType: 'json',
        type: 'GET',
        cache: false,
        success: function (data) {
          window.location = './block.html?hash=' + data.hash
        },
        error: function () {
          setSearchValueErrorState(true)
        }
      })
    }
  } else if (isHash(term)) {
    /* Great, we're pretty sure that this is a hash, let's see if we can find out what type */

    if (ExplorerConfig.daemonMode) {
      /* In daemon mode: try block hash, then transaction hash */
      daemonRpc('getblockheaderbyhash', { hash: term }, function (result) {
        window.location = './block.html?hash=' + result.block_header.hash
      }, function () {
        daemonRpc('f_transaction_json', { hash: term }, function (result) {
          window.location = './transaction.html?hash=' + result.txDetails.hash
        }, function () {
          if (!searchTransactionPool(term)) {
            setSearchValueErrorState(true)
          }
        })
      })
    } else {
      /* Let's see if it's a block hash first? */
      $.ajax({
        url: ExplorerConfig.apiBaseUrl + '/block/header/' + term + '?random=' + (new Date()).getTime(),
        dataType: 'json',
        type: 'GET',
        cache: false,
        success: function (data) {
          /* We found a block that matched, let's go take a look at it */
          window.location = './block.html?hash=' + data.hash
        },
        error: function () {
          /* It's not a block, is it a transaction? */
          $.ajax({
            url: ExplorerConfig.apiBaseUrl + '/transaction/' + term + '?random=' + (new Date()).getTime(),
            dataType: 'json',
            type: 'GET',
            cache: false,
            success: function (data) {
              /* Great, we found a matching transaction, let's go take a look at it */
              window.location = './transaction.html?hash=' + data.tx.hash
            },
            error: function () {
              /* It's not a transaction hash, must be a paymentId */
              $.ajax({
                url: ExplorerConfig.apiBaseUrl + '/transactions/' + term + '?random=' + (new Date()).getTime(),
                dataType: 'json',
                type: 'GET',
                cache: false,
                success: function (data) {
                  if (data.length !== 0) {
                    /* It's a payment Id, let's display the list */
                    window.location = './paymentid.html?id=' + term
                  } else {
                    if (!searchTransactionPool(term)) {
                      setSearchValueErrorState(true)
                    }
                  }
                },
                error: function () {
                  if (!searchTransactionPool(term)) {
                    setSearchValueErrorState(true)
                  }
                }
              })
            }
          })
        }
      })
    }
  } else {
    setSearchValueErrorState(true)
  }
}

function setSearchValueErrorState (state) {
  if (state) {
    $('#searchValue').addClass('is-danger')
  } else {
    $('#searchValue').removeClass('is-danger')
  }
}

function getQueryStringParam (key) {
  const queryString = window.location.search.substring(1)
  const params = queryString.split('&')
  for (var i = 0; i < params.length; i++) {
    var param = params[i].split('=')
    if (param[0] === key) {
      return decodeURIComponent(param[1])
    }
  }
}

function secondsToHumanReadable (seconds) {
  var days = Math.floor(seconds / (3600 * 24))
  seconds -= days * 3600 * 24
  var hrs = Math.floor(seconds / 3600)
  seconds -= hrs * 3600
  var mnts = Math.floor(seconds / 60)
  seconds -= mnts * 60

  return {
    days: days,
    hours: hrs,
    minutes: mnts,
    seconds: seconds
  }
}
