module.exports = class {

	constructor(socket, queryQueue) {
		this.socket = socket;
		this.queryQueue = queryQueue;
	}

	parse(data) {

		const responseTo = data.readInt32LE(8);
		const responseFlags = data.readInt32LE(16);	

		if (this._responseTo !== responseTo) {	
			if (this.callback) this.callback("Error occured.");
			return;	
		}

		if (this._protocol) {
			var result = this._protocol.parseReply(data);
			if (result.error && this.callback) {
				this.callback(result.error);
				this.processNext();
				return;
			}
			if (result.data.ok === 0) {
				if (this.callback) this.callback(result.data);
				this.processNext();
				return;
			}

			if (!this.result) this.result = {};
			this.result = {... this.result, ...result.data };
		
			if (responseFlags === 0) {
				if (this.callback) this.callback(null, this.result);
				this.processNext();
			} else {
				const buffer = this._protocol.getBuffer({ getMore: cursorId, collection: this.result.ns });
				this.socket.write(buffer);
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