var net = require('net');
var s = net.createServer(function(socket){
  socket.on('data', function(data){
    console.log(data.toString())
    socket.write(data);
  })
});
s.listen(8003);
