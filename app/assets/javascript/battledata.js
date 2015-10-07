function BattleData(data) {
	$.observable(this);

	this.addData(data);
};

var battledata = BattleData.prototype;

battledata.addData = function(data) {
	$.extend(this, data);
};

battledata.dealWithCommand = function(params) {

};