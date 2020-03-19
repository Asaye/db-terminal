const TYPES = require("./types_mysql.json");

module.exports = class {

	constructor(socket, queryQueue) {
		this.socket = socket;
		this.queryQueue = queryQueue;
	}

	
	_parseResultSet(data) {
		var index = data.toString().indexOf("def", this.offset);
		if (index === -1) return;

		if (this.results === null || this.results === undefined) {
			this.results = {fields: [], types: {}, rows: [], cols: {}};
		}
		var length = 0, name, last = 10, nColumns = 0, temp, dbName, table_alias, table;
 		
 		do {
	 		this.offset = index + 3;  // 3bytes for 'def'
	 		for (var j = 0; j < 5; j++) {
	 			length = data.readInt8(this.offset++);
		 		name = data.toString("utf-8", this.offset, this.offset += length);

		 		if (!dbName && j === 0) dbName = name;
		 		if (!table_alias && j === 1) table_alias = name;
		 		if (!table && j === 2) table = name;
		 		if (j === 3) {
		 			this.results.fields.push({ "alias": name });			 					 			
		 		}
		 		if (j === 4) {
		 			this.results.fields[nColumns].name = name;
		 			this.results.cols[name] = [];			
		 			temp = name; 			
		 		}
	 		}
	 		var charset, column_length, type_code, decimals, prefix = "0x";

	 		length = data.readInt8(this.offset++);
		 	charset = data.readInt16LE(this.offset);
		 	this.offset += 2;
		 	column_length = data.readInt32LE(this.offset);		 	
		 	this.offset += 4;
		 	type_code = data[this.offset].toString(16);
		 	type_code = type_code.length === 1 ? prefix + "0" + type_code : prefix + type_code;			 	
		 	this.results.types[temp] = TYPES[type_code];
		 	this.offset += 3;
	 		decimals = data.readInt8(this.offset++);
	 		index = data.toString().indexOf("def", this.offset);
	 		nColumns++;
 		} while(index != -1);

 		this.results.database = dbName;
 		this.results.table = table;
 		this.results.table_alias = table_alias;
 			
 		this.offset = data.indexOf(0xfe, this.offset) + 9; // = 5bytes(EOF packet) + 4bytes(data field)
 		
 		var row = {}, item, field;
	 	do {
	 		row = {};
	 		for (var j = 0; j < nColumns; j++) {

	 			if (data[this.offset] === 251) {
	 				this.offset++;
	 				item = null;
	 				length = 0;
	 			}	else {
	 				length = data.readInt8(this.offset++);
	 				item = data.toString("utf-8", this.offset, this.offset + length);			 			
		 		}			 		

		 		field = this.results.fields[j].name;
		 		this.offset += length;
				if (this.results.types[field] === "INT24" || this.results.types[field] === "LONG") {
						item = parseInt(item);
				} else if (this.results.types[field] === "FLOAT" || this.results.types[field] === "DOUBLE") {
						item = parseFloat(item);
				}  
				
				this.results.cols[field].push(item);
	 			row[field] = item;		 			 			
	 		}
	 		this.results.rows.push(row);
 			this.offset += 4;
 		} while (this.offset + 7 < data.length);
 		
 		if (this.callback) {
 			this.callback(null, this.results);
 		}
	}

	_error(data) {
		var code, message;
		code = data.readInt16LE(this.offset);
		this.offset += 3;			
		message = data.slice(this.offset, this.length).toString().replace(/\'/g, '"');
		if (this.callback) this.callback({
			"code": code,
			"message": message 
		});
		this.processNext();		
	}

	parse(data) {
		var len, sequenceNum, nFields, nRows, lastRowId, 
		    status, nWarnings, temp, message;

		this.offset = 0;
		len = data.readIntLE(0, 3);
		this.offset += 3;
	 	sequenceNum = data.readInt8(this.offset++);
	 	if (data[this.offset] === 255) {  // 0xff = 255 = error code
	 		this.offset++;
	 		this._error(data.slice(this.offset));	
	 		return;
	 	}

	 	nFields = data.readInt8(this.offset++); // number of affected fields
	 
	 	if (nFields === 0xfe) return; 

	 	nRows = data.readInt8(this.offset++); 
	
	 	if (nRows === 251) {
	 		nRows = null;
	 	} else if (nRows === 252 || nRows === 253) {
	 		this.offset += (nRows - 250);
	 		nRows = data.readIntLE(this.offset, (nRows - 250));
	 	}	else if (nRows === 254) {
	 		this.offset += 8;
	 		// big integer
	 	}

	 	lastRowId = data.readInt8(this.offset++); 
	 	if (lastRowId === 251) {
	 		lastRowId = null;
	 	} else if (lastRowId === 252 || lastRowId === 253) {
	 		this.offset += (nRows - 250);
	 		lastRowId = data.readIntLE(this.offset, (lastRowId - 250));
	 	}	else if (lastRowId === 254) {
	 		this.offset += 8;
	 		// big integer
	 	}

	 	status = data.readInt16LE(this.offset);
	 	this.offset += 2; 

	 	nWarnings = data.readInt8(this.offset++); 
	 	//this.offset += 2; 	
	 	
	 	if (status !== 0x0008) {
	 		this.processNext();
	 	}
	 	
	 	if (sequenceNum === 1 && (status <= 0x0040 || status >= 0x0400)) {
	 		temp = data.readInt8(this.offset++);	
	 		if (temp > 0) {
	 			message = data.toString("utf-8", this.offset, this.offset + temp);
	 		} else {
	 			message = `${nRows} row(s) affected.`
	 		}
	 		if (this.callback) this.callback(null, message);
	 		return;
	 	} else if (status > 0x000b) {	 		
	 		this._parseResultSet(data);
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