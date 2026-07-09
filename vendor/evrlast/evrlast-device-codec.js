 // Please read here on how to implement the proper codec: https://www.thethingsindustries.com/docs/integrations/payload-formatters/javascript/
function decodeUplink(input) {                                                                                                                                      
    var data = input.bytes;                                                                                                                                           
    var pos = 0;

    function readVarint() {
      var result = 0, shift = 0;
      while (pos < data.length) {                                                                                                                                     
        var byte = data[pos++];
        result |= (byte & 0x7F) << shift;                                                                                                                             
        if ((byte & 0x80) === 0) break;
        shift += 7;
      }                                                                                                                                                               
      return result;
    }                                                                                                                                                                 
                  
    function readBytes() {
      var len = readVarint();
      var bytes = data.slice(pos, pos + len);
      pos += len;
      return bytes;
    }
                                                                                                                                                                      
    var msgBytes = readBytes();
    var msgPos = 0;                                                                                                                                                   
                  
    function msgReadVarint() {
      var result = 0, shift = 0;
      while (msgPos < msgBytes.length) {
        var byte = msgBytes[msgPos++];
        result |= (byte & 0x7F) << shift;                                                                                                                             
        if ((byte & 0x80) === 0) break;
        shift += 7;                                                                                                                                                   
      }           
      return result;
    }

    function msgReadBytes() {                                                                                                                                         
      var len = msgReadVarint();
      var bytes = msgBytes.slice(msgPos, msgPos + len);                                                                                                               
      msgPos += len;
      return bytes;
    }

    var sensors = [];
    while (msgPos < msgBytes.length) {
      var tag = msgReadVarint();                                                                                                                                      
      var fieldNum = tag >> 3, wireType = tag & 7;
                                                                                                                                                                      
      if (fieldNum === 1 && wireType === 2) {
        var valueBytes = msgReadBytes();
        var vPos = 0;                                                                                                                                                 
   
        function vReadVarint() {                                                                                                                                      
          var result = 0, shift = 0;
          while (vPos < valueBytes.length) {
            var byte = valueBytes[vPos++];
            result |= (byte & 0x7F) << shift;
            if ((byte & 0x80) === 0) break;                                                                                                                           
            shift += 7;
          }                                                                                                                                                           
          return result;
        }

        var value = {};
        while (vPos < valueBytes.length) {
          var vTag = vReadVarint();
          var vFieldNum = vTag >> 3;                                                                                                                                  
   
          if (vFieldNum === 1) value.identifier = vReadVarint();                                                                                                      
          else if (vFieldNum === 2) value.value = vReadVarint(); 
          else if (vFieldNum === 3) value.port = vReadVarint();                                                                                                       
        }                                                                                                                                                             
                                                                                                                                                                      
        sensors.push(value);                                                                                                                                          
      }           
    }

    return {
      data: {
        measurementValues: sensors
      }
    };
}