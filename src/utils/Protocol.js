const BSON = require('./BSON');
const bson = new BSON();
const ERROR_TYPES = ["writeErrors", "writeConcernError"];

module.exports = class {	

	constructor(id) {
		this._requestId = id;
	}

	getBuffer(data) {
		const payload = bson.serialize(data);
		const header = this._header(payload.length + 4 + 1);

		const buffer = Buffer.alloc(16 + 4 + 1 + payload.length);
		header.copy(buffer);
		buffer.writeInt32LE(0, 16); // flag bits
		buffer[20] = 0; // payload type
		payload.copy(buffer, 21);
		return buffer;
	}

	parseReply(data) {		
		const length = data.readInt32LE();
		const requestId = data.readInt32LE(4);
		const responseTo = data.readInt32LE(8);
		const opCode = data.readInt32LE(12);

		const responseFlags = data.readInt32LE(16);		
		
		var offset = 20, payloadType, len, result = {}, partial, error,
				response = { error: null, data: null };
		do {
			payloadType = data[offset++];
			len = data.readInt32LE(offset);
			partial = bson.deserialize(data.slice(offset, offset + len));
			result = {...result, ...partial };
			offset += len;
			error = this._checkForErrors(result);
			if (error) {
				response.error = error;
				return response;
			}		
		} while (offset < data.length);

		response.data = result;
		return response;
	}

	_header(len) {
		var header = Buffer.alloc(16);
		header.writeInt32LE(len + 16);                                  // length
		header.writeInt32LE(this._requestId || 0, 4);                   // requestId
		// responseTo is skipped as there is no use for the client side
		header.writeInt32LE(2013, 12);                 // opCode
		return header;
	}	

	_checkForErrors(result) {
		var error;
		ERROR_TYPES.forEach((type) => {
			if (result[type]) {
				error = result[type];
			}
		});
		return error;			
	}
};