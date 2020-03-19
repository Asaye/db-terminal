const TYPES = require("./types_postgresql.json");

module.exports = class {

	constructor(socket, queryQueue) {
		this.socket = socket;
		this.queryQueue = queryQueue;
	}

	parse(data) {
		var offset = 0, len, code, buff;
		do {			
			code = data[offset++];			
			len = data.readUInt32BE(offset);
			offset += 4;			
			buff = data.slice(offset, offset + len - 4);			
			this._delegateParsers(String.fromCharCode(code), buff);			
			offset += len - 4;				
		} while (offset < data.length);
	}
	
	_delegateParsers(header, buffer) {
		var offset = 0;
		if (this.results === null || this.results === undefined) {
			this.results = {fields: [], types: {}, rows: [], cols: {}};
		}
		switch (header) {
			case "R": {
				break;
			}
			case "E": {				
				var err = {"code": "", "message": ""}, code, msg;

				do {
					code = buffer.toString("utf-8", offset, ++offset);					
					end = buffer.indexOf(0, offset);
					msg = buffer.toString("utf-8", offset, end);
					if (code === "C") {
						err.code = msg;
					} else if (code === "M") {
						err.message = msg;
					}
					offset = end + 1;
				} while(offset < buffer.length - 1);

				if (this.callback) this.callback(err);
				this.processNext();
				break;
			}
			case "Z": {				
				this.processNext();
				break;
			}
			case "C": {
				if (this.results && this.callback) {
					this.results.fields = this.fields;
					this.callback(null, this.results);
				}
				break;
			}
			case "T": {
				var end, name, type, temp, fieldCount;

				this.fields = [];
				this.types = [];
				
				fieldCount = buffer.readInt16BE(offset);
				offset += 2;
				
				for (var i = 0; i < fieldCount; i++) {
					end = buffer.indexOf(0, offset);
					name = buffer.toString("utf-8", offset, end);
					this.fields.push(name);
					type = buffer.readInt32BE(end + 7);
					console.log(type);
					this.results.types[name] = TYPES[type];
					this.results.cols[name] = [];
					offset = end + 19;
				}	
				break;	
			}
			case "D": {
				offset = 2;

				var len, val, row = {}, col = {};		

				for (var i = 0; i < this.fields.length; i++) {					
					len = buffer.readInt32BE(offset);
					offset += 4;
					if (len === -1) {
						val = null;
						len = 0;
					} else {
						val = buffer.toString("utf-8", offset, offset + len);
						val = isNaN(parseFloat(val)) ? val : parseFloat(val);
					}					
					row[this.fields[i]] = val;
					this.results.cols[this.fields[i]].push(val);

					offset += len;
				}
				
				this.results.rows.push(row);
				break;
			}
		}
	}

	processNext() {
		if (this.queryQueue.length > 0) {
			this.socket.emit('processingQuery');
			const next = this.queryQueue.shift();
			
			if (next.buffer) {
				this.socket.write(next.buffer, 'binary');
				this.callback = next.callback;
				this._responseTo = next.requestId;
				this._protocol = next.protocol;
			} else {
				if (next.callback) {
					next.callback("Error occured.");
				}
			}
		} else {
			this.socket.emit('readyForQuery');
		}
	}
}