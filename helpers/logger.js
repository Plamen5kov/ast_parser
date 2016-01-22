// modified npm module: log-client-node

var fs = require('fs'),
	path = require('path'),
	os = require('os');

module.exports = function(setting){
	
    var logDirectory = setting.logDirectory;
    if (!fs.existsSync(logDirectory)){
        console.error("ERROR ACCESSING TO LOG FILE DIRECTORY :" + logDirectory);
        process.exit(-1);
    }
    if (os.type().indexOf('Windows') === -1){
        var appLogStat = fs.statSync(logDirectory);
        if (canWrite(process.uid === appLogStat.uid, process.gid === appLogStat.gid, appLogStat.mode)){
            console.error("ERROR WRITING TO LOG FILE DIRECTORY : " + logDirectory);
            process.exit(-1);
        }
    }

    var appLog = createLog(setting.APP_NAME, logDirectory, setting);
	
	if(setting.disable) {
		for(var prop in appLog) {
			appLog[prop] = function() {};
		}
	}
	return appLog;
};

function canWrite(owner, inGroup, mode){
    return owner && (mode & 00200) || // User is owner and owner can write.
        inGroup && (mode & 00020) || // User is in group and group can write.
        (mode & 00002); // Anyone can write.
}

function createLog(appName, logDirectory, setting){
	
	var appLog;
	
    function getRequestId() {
        return (process.domain && process.domain.id) || "";
    }

    /**
     * get log Date. For example: 2014-09-09
     * @returns {string}
     */
    function getLogDate(){
        var today = new Date();
        var month = "0"+(today.getMonth() + 1);
        if(month.length>2){
            month = month.substring(1,3);
        }
        var day = "0"+today.getDate();
        if(day.length>2){
            day = day.substring(1,3);
        }
        var logDate = today.getFullYear() + "-" + month + "-" + day;
        return logDate;
    }

    appLog = require('tracer')[setting.strategy]({
        level:      setting.level,
        format:     "timestamp:{{timestamp}}|$|line:{{line}}|$|message:\t{{message}}",
        dateformat: "yyyy-mm-dd/HH:MM:ss",
        preprocess: function(data) {
            if (data) data.requestId = getRequestId();
        },
        transport:  function(data){

            if (data.title === 'error') {
                console.error(data.output);
            } else {
                console.log(data.output);
            }

            var logDate = getLogDate();
            var appLogFile = path.join(logDirectory, logDate + "-" + appName + "-node.log");
            fs.open(appLogFile, 'a', 0666, function(err, id){
                if (!err){
                    fs.write(id, data.output + "\n", null, 'utf8', function(){
                        fs.close(id, function(){
                        });
                    });
                } else {
                    console.log('ERROR OPENING AND WRITING TO LOG FILE');
                    console.log(err);
                    fs.close(id, function(){
                    });
                }
            });

            var appClsLogFile = path.join(logDirectory, logDate + "-" + appName + "-node.log.temp");
            fs.open(appClsLogFile, 'a', 0666, function(err, id){

                var clslog = data.output.replace(/\n/g,'|#|');

                if (!err){
                    fs.write(id, clslog + "\n", null, 'utf8', function(){
                        fs.close(id, function(){
                        });
                    });
                } else {
                    console.log('ERROR OPENING AND WRITING TO LOG FILE');
                    console.log(err);
                    fs.close(id, function(){
                    });
                }
            });
        }
    });

    appLog.newTransaction=function(transactionContext){
        if(process.domain){
            var now=new Date();
            var startTime = now.getTime();
            process.domain._startTime=startTime;
            process.domain._transactionContext=transactionContext;
        }else{
            appLog.error('process.domain is null. Cannot use transaction feature!');
        }

    };
    appLog.completeTransaction=function(){
        if(process.domain && process.domain._startTime){
            var now2=new Date();
            var endTime = now2.getTime();
            var duration = endTime-process.domain._startTime;
            appLog.info('{transContext:'+JSON.stringify(process.domain._transactionContext)+','+'duration:'+duration+'}');
        }
    };

    return appLog;
}

