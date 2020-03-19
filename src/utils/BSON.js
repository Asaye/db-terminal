const CODE_DOUBLE     = Buffer.from([0x01]);
const CODE_STRING     = Buffer.from([0x02]);
const CODE_EMBEDDED   = Buffer.from([0x03]);
const CODE_ARRAY      = Buffer.from([0x04]);
const CODE_BINARY     = Buffer.from([0x05]);
const CODE_OID        = Buffer.from([0x07]);
const CODE_BOOLEAN    = Buffer.from([0x08]);
const CODE_DATE       = Buffer.from([0x09]);
const CODE_NULL       = Buffer.from([0x0A]);
const CODE_REGEX      = Buffer.from([0x0B]);
const CODE_JS         = Buffer.from([0x0D]);
const CODE_JS_WS      = Buffer.from([0x0F]);
const CODE_INTEGER    = Buffer.from([0x10]);
const CODE_TIME       = Buffer.from([0x11]);
const CODE_BIGINT     = Buffer.from([0x12]);
const CODE_DECIMAL    = Buffer.from([0x13]);

module.exports = class {

	constructor() {
		this.document = Buffer.alloc(1024);
		this.buffers = [];
		this.offset = 0;
	}

	serialize(data, type) {
		this.offset = 0;
		if (this.document.length > 1024) {
			this.document = this.document.subarray(0, 1024);
		}
		if (type === "array") {
			this._encodeArray(data);
			return this.document.slice(0, this.offset);
		} else {
			this._encodeObject(data);
			return this.document.slice(0, this.offset);
		}
	}

	deserialize(data, type) {
		if (type === "array") {
			return this._decodeArray(data);
		} else {
			return this._decodeObject(data);
		}
	}

	_encodeObject(data) {
		if (!data) return;
		const keys = Object.keys(data);
		var length, start = this.offset;
		
		if (keys.length === 0) {
			if (this.offset + 5 > this.document.length) {
				this.document = Buffer.concat([this.document, Buffer.alloc(1024)]);
			}
			this.document.writeInt32LE(5, this.offset);
			this.document[this.offset + 4] = 0;			
			this.offset += 5;
			return this.document.slice(this.offset - 5, this.offset);
		}

		var buf_key, val, code, code_index;	
		if (this.offset + 4 > this.document.length) {
			this.document = Buffer.concat([this.document, Buffer.alloc(1024)]);
		}
		this.offset += 4; // reserve 4 spaces for length

		keys.forEach((key) => {

			val = data[key];
			if ((this.offset + 1 + key.length + 1 + 8) > this.document.length) {
				this.document = Buffer.concat([this.document, Buffer.alloc(1024)]);
			}
			code_index = this.offset++;
			this.document.write(key + "\0", this.offset, key.length + 1);
			this.offset += (key.length + 1);
			if (val === false) {
				code = CODE_BOOLEAN;
				this.document[this.offset++] = 0x00;
			} else if (val === true) {
				code = CODE_BOOLEAN;				
				this.document[this.offset++] = 0x01;
			} else if (val === null || val === undefined) {
				code = CODE_NULL;
			} else if (typeof val === 'string') {
				code = CODE_STRING;	
				if ((this.offset + 4 + val.length + 1) > this.document.length) {
					this.document = Buffer.concat([this.document, Buffer.alloc(1024)]);
				}
				this.document.writeInt32LE(val.length + 1, this.offset);
				this.offset += 4;
				this.document.write(val + "\0", this.offset, val.length + 1);
				this.offset += (val.length + 1);
			} else if (typeof val === 'number' && parseInt(val) === val) {
				code = CODE_INTEGER;
				this.document.writeInt32LE(val, this.offset);
				this.offset += 4;
			} else if (typeof val === 'number') {
				code = CODE_DOUBLE;
				this.document.writeDoubleLE(val, this.offset);
				this.offset += 8;
			} else if (typeof val === 'object' && Array.isArray(val)) {
				code = CODE_ARRAY;
				this._encodeArray(val);
			} else if (typeof val === 'object') {
				code = CODE_EMBEDDED;
				this._encodeObject(val);
			} 
			code.copy(this.document, code_index);
		});
		if (this.offset + 1 > this.document.length) {
			this.document = Buffer.concat([this.document, Buffer.alloc(1)]);
		}
		this.document[this.offset++] = 0;
		this.document.writeInt32LE(this.offset - start, start);	
	}

	_decodeObject(data) {
		
		var offset = 0, code, e_name, end, len, decoded = {};
		const length = data.readInt32LE(offset);
		offset += 4;
		
		while(offset < data.length - 4) {
			code = data[offset++];
			end = data.indexOf(0, offset);
			e_name = data.toString("utf-8", offset, end);
			offset = end + 1;
			
			if (code === 0x01) {
				decoded[e_name] = data.readDoubleLE(offset);
				offset += 8;
			} else if (code === 0x02) {
				len = data.readInt32LE(offset);
				offset += 4;
				decoded[e_name] = data.toString("utf-8", offset, offset + len - 1);
				offset += len;	
			} else if (code === 0x03) {
				len = data.readInt32LE(offset);	
				decoded[e_name] = this._decodeObject(data.slice(offset, offset + len));
				offset += len;
			} else if (code === 0x04) { 
				len = data.readInt32LE(offset);	
				var temp = this._decodeObject(data.slice(offset, offset + len));
				var array = [];
				Object.keys(temp).forEach((key) => {
				 	array.push(temp[key]);
				});
				decoded[e_name] = array;
				offset += len;
			} else if (code === 0x05) { 		
				len = data.readInt32LE(offset);
				offset += 4;
				var subtype = data[offset++];		
				decoded[e_name] = data.toString("utf-8",  offset, offset + len);
				offset += len;
			} else if (code === 0x07) { 						
				decoded[e_name] = data.slice(offset, offset + 12).toString('hex');
				offset += 12;
			} else if (code === 0x08) {
				if (data[offset] === 0x00) {
					decoded[e_name] = false;
				} else if (data[offset] === 0x01) {
					decoded[e_name] = true;
				}
				offset++;
			} else if (code === 0x09) {
				decoded[e_name] = data.readDoubleLE(offset);
				offset += 8;
			} else if (code === 0x0A) {
				 decoded[e_name] = null;
			} else if (code === 0x0B) {
				end = data.indexOf(0, offset);				
				var regex = data.toString("utf-8", offset, end);
				offset = end + 1;
				end = data.indexOf(0, offset);
				var options = data.toString("utf-8", offset, end);
				offset = end + 1;
				decoded[e_name] = {
					regex: regex,
					regex_options: options
				};
			} else if (code === 0x0D) {
				len = data.readInt32LE(offset);
				offset += 4;
				decoded[e_name] = data.toString("utf-8", offset, offset + len);
				offset += len;
			} else if (code === 0x0F) {
				len = data.readInt32LE(offset);	
				offset += 4;
				var key = data.toString("utf-8", offset, offset + len);
				offset += len;
				var js_w_s = {};
				len = data.readInt32LE(offset);
				js_w_s[key] = this._decodeObject(data.slice(offset, offset + len));
				decoded[e_name] = js_w_s;
				offset += len;
			} else if (code === 0x10) {
				decoded[e_name] = data.readInt32LE(offset);
				offset += 4;
			} else if (code === 0x11) {
				decoded[e_name] = data.readDoubleLE(offset);
				offset += 8;
			} else if (code === 0x12) {
				decoded[e_name] = data.readDoubleLE(offset);
				offset += 8;
			} else if (code === 0x13) {
				decoded[e_name] = data.toString("utf-8", offset, offset + 16);
				offset += 16;
			} else if (code === 0xff) {
				//Min key
			} else if (code === 0x7f) {
				// Max key
			}
		}
		return decoded;
	}

	_decodeArray(data) {
		if (!data) return;

		const length = data.readInt32LE();
		const code = data[4];
		const decoded = this._decodeObject(data.slice(5));
		var array = [];
		Object.keys(decoded).forEach((key, index) => {
			array.push(decoded[key]);
		});

		return array;
	}

	_encodeArray(data) {
		var toObject = {};
		data.forEach((item, index) => {
			toObject[index] = item;
		});
		this._encodeObject(toObject);
	}

	_encodeArray2(data) {
		if (!data) return;
		
		var buf_key, buf_val, buf_len, length, len, doc, code, offset = 0;
		
		length = Buffer.alloc(4);		

		if (data.length === 0) return Buffer.concat([CODE_ARRAY, length]);		
			
		doc = Buffer.alloc(1024);

		data.forEach((item, index) => {
			buf_key = Buffer.from(index + "\0");
			if (item === true) {
				buf_val = Buffer.alloc(1);
				buf_val[0] = 0x01;
				code = CODE_BOOLEAN;
			} else if (item === false) {
				buf_val = Buffer.alloc(1);
				buf_val[0] = 0x00;
				code = CODE_BOOLEAN;
			} else if (item === null || item === undefined) {
				buf_val = Buffer.alloc(1);
				buf_val[0] = 0x0A;
				code = CODE_NULL;
			} else if (typeof item === 'string') {
				len = item.length + 1;
				buf_val = Buffer.alloc(len + 4);
				buf_val.writeInt32LE(len);
				buf_val.write(item + "\0", 4);
				code = CODE_STRING;
			} else if (typeof item === 'number' && parseInt(item) === item) {
				buf_val = Buffer.alloc(4);
				buf_val.writeInt32LE(item);
				code = CODE_INTEGER;
			} else if (typeof item === 'number') {
				buf_val = Buffer.alloc(8);
				buf_val.writeDoubleLE(item);
				code = CODE_DOUBLE;
			} else if (typeof item === 'object' && Array.isArray(item)) {
				buf_val = this._encodeArray(item);
				code = CODE_ARRAY;
			} else if (typeof item === 'object') {
				buf_val = this._encodeObject(item);
				code = CODE_EMBEDDED;
			}  
			len = (1 + buf_key.length + buf_val.length + 1);
			if (offset + len >= doc.length) {
				doc = Buffer.concat(doc, Buffer.alloc(1024));
			}
			doc[offset] = code[0];
			offset++;
			doc.fill(buf_key, offset, offset + buf_key.length);
			offset += buf_key.length;	
			doc.fill(buf_val, offset, offset + buf_val.length);
			offset += buf_val.length;
		});
		doc.write("\0", offset);
		offset++;
		length.writeInt32LE(offset + 4);
		buf_len = Buffer.alloc(4);
		buf_len.writeInt32LE(offset);
		return Buffer.concat([length, CODE_ARRAY, buf_len, doc.slice(0, offset)]);
	}
};