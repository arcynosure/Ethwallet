
function importWallet(password){
var file = document.getElementById("key").files[0];
          if (file) {
          var reader = new FileReader();
          reader.readAsText(file, "UTF-8");
                    reader.onload = function (evt) {
                    global_keystore = lightwallet.keystore.deserialize(evt.target.result);
                    newAddress(password);
                    //Function to store and download the wallet.
                    console.log(global_keystore.getAddresses());
                    }
                    reader.onerror = function (evt) {
                    alert("Error reading keystore file");
                    }
          }
}


function download(){
     var x = new Date();
     var UTCseconds = (x.getTime() + x.getTimezoneOffset()*60*1000)/1000;
     var address = global_keystore.getAddresses()[0];
     var name = 'Keystore - ' + address + ' - ' + (new Date()).toUTCString() ;
     var element = document.createElement('a');
     var keystore = global_keystore.serialize();
     element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(keystore));
     element.setAttribute('download', name);
     element.style.display = 'none';
     document.body.appendChild(element);
     element.click();
     document.body.removeChild(element);
}

function setSeed(password, seedphrase){
  lightwallet.keystore.createVault({
  password: password,
  seedPhrase: seedphrase,
  //random salt
  hdPathString: "m/0'/0'/0'"
  },
  function (err, ks) {
  global_keystore = ks
  newAddress(password);
  console.log(global_keystore.getAddresses());
  })
}

function showSeed(password){
     global_keystore.keyFromPassword(password, function(err, pwDerivedKey) {
     var seed = global_keystore.getSeed(pwDerivedKey);
     console.log(seed);
     });
}

function newAddress(password){
  global_keystore.keyFromPassword(password, function(err, pwDerivedKey) {
  global_keystore.generateNewAddress(pwDerivedKey, '1');
  console.log(global_keystore.getAddresses());
  });
}

function createWallet(password) {

  var extraEntropy = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 5; i++)
  extraEntropy += possible.charAt(Math.floor(Math.random() * possible.length));
  var randomSeed = lightwallet.keystore.generateRandomSeed(extraEntropy);
      lightwallet.keystore.createVault({
      password: password,
      seedPhrase: randomSeed,
      //random salt
      hdPathString: "m/0'/0'/0'"
      },
      function (err, ks) {
      global_keystore = ks;
      showSeed(password);
      newAddress(password);
      download();
      //Function to store and download the wallet.
      });
}

function getTXhistrory(checkaddress) {

    var endBlockNumber = eth.blockNumber;
    var startBlockNumber = 5537922;
    console.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);
          for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          if (i % 1000 == 0) {
          console.log("Searching block " + i);
          }
          var block = eth.getBlock(i, true);
                if (block != null && block.transactions != null) {
                          block.transactions.forEach( function(e) {
                                  if (checkaddress == "*" || checkaddress == e.from || checkaddress == e.to) {
                                  console.log("  tx hash          : " + e.hash + "\n"
                                  + "   nonce           : " + e.nonce + "\n"
                                  + "   blockHash       : " + e.blockHash + "\n"
                                  + "   blockNumber     : " + e.blockNumber + "\n"
                                  + "   transactionIndex: " + e.transactionIndex + "\n"
                                  + "   from            : " + e.from + "\n"
                                  + "   to              : " + e.to + "\n"
                                  + "   value           : " + e.value + "\n"
                                  + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
                                  + "   gasPrice        : " + e.gasPrice + "\n"
                                  + "   gas             : " + e.gas + "\n"
                                  + "   input           : " + e.input);
                                  }
                          })
                }
          }
}

function getETHBalance(address) {
         web3.eth.getBalance(address, function(err, balance) {
               if(err)
               {
               console.log(err);
               }
               if(balance) {
               console.log(balance);
               }
         });
}

 async function getERC20Balance(address, contractAddress) {

      var myContract = new web3.eth.Contract(abiArray, contractAddress);

      myContract.methods.balanceOf(address).call({from: address}, function(error, result){
      var decimal = 18;
      var adjustedBalance = result / Math.pow(10, decimal)
      console.log(adjustedBalance);
      });


}


function sendERC20(fromadd, toAddr, value, contractAddress) {

var val = web3.utils.toHex(web3.utils.toWei(value, 'ether'));
password = prompt('Enter password to retrieve addresses', 'Password');

              global_keystore.keyFromPassword(password, function(err, pwDerivedKey) {
              if (!global_keystore.isDerivedKeyCorrect(pwDerivedKey)) {
                          throw new Error("Incorrect derived key!");
              }
              var privKey = global_keystore.exportPrivateKey(fromadd, pwDerivedKey);
              var privateKey = new EthJS.Buffer.Buffer(privKey, 'hex');
              var contract = new web3.eth.Contract(abiArray, contractAddress, { from: fromadd });
                              web3.eth.getTransactionCount(fromadd).then(function(noncecount){
                              console.log(noncecount);

                                                        web3.eth.getGasPrice().then(function(price){
                                                        var avgprice = web3.utils.toHex(price);
                                                        console.log(avgprice);
                                                                   var rawTx = {
                                                                      nonce: web3.utils.toHex(noncecount),
                                                                      from: fromadd,
                                                                      gasPrice: avgprice,
                                                                      gasLimit: web3.utils.toHex(800002),
                                                                      to: contractAddress,
                                                                      value: 0x00,
                                                                      data: contract.methods.transfer(toAddr, val).encodeABI(),
                                                                   }
                                                                   var tx = new EthJS.Tx(rawTx);
                                                                   tx.sign(privateKey);
                                                                   var serializedTx = tx.serialize();

                                                                   web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
                                                                   .on('transactionHash', function(transactionHash){
                                                                   console.log(transactionHash);
                                                                   })
                                                                   .on('error', console.error); // If a out of gas error, the second parameter is the receipt.

                                                        });
                              });
              });

}

function sendETH(fromadd, toAddr, value) {

  var val = web3.utils.toHex(web3.utils.toWei(value, 'ether'));
  password = prompt('Enter password to unlock account', 'Password');

                    global_keystore.keyFromPassword(password, function(err, pwDerivedKey) {
                    if (!global_keystore.isDerivedKeyCorrect(pwDerivedKey)) {
                                throw new Error("Incorrect derived key!");
                    }

                    var privKey = global_keystore.exportPrivateKey(fromadd, pwDerivedKey);
                    var privateKey = new EthJS.Buffer.Buffer(privKey, 'hex');
                                      web3.eth.getTransactionCount(fromadd).then(function(noncecount){
                                                          web3.eth.getGasPrice().then(function(price){
                                                          var avgprice = web3.utils.toHex(price);

                                                          var rawTx = {
                                                              nonce: web3.utils.toHex(noncecount),
                                                              from: fromadd,
                                                              gasPrice: avgprice,
                                                              gasLimit: web3.utils.toHex(800002),
                                                              to: toAddr,
                                                              value: val,
                                                           }
                                                           var tx = new EthJS.Tx(rawTx);
                                                           tx.sign(privateKey);
                                                           var serializedTx = tx.serialize();

                                                           web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
                                                           .on('transactionHash', function(transactionHash){
                                                           console.log(transactionHash);
                                                           })
                                                           .on('error', console.error); // If a out of gas error, the second parameter is the receipt.

                                                         });
                                      });
                    });

}
