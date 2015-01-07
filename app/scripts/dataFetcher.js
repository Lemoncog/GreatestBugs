function fetchData(callback) {
	console.log("Trying to load JSON data");

	$.getJSON("data/crashLogAll.json", function(json) {

		console.log("Loaded");

		//TODO - Smart groupings based on memory messages e.g MESSAGE@memory should be grouped together
		var bugs = _.chain(json.records)
		.map(function(bug) {
			exceptionClassName = bug['Exception Class Name'];
			throwingFileName = bug['Throwing File Name'];
			throwingClassName = bug['Throwing Class Name'];
			throwingMethodName = bug['Throwing Method Name'];
			combinedKey = exceptionClassName + ':' + throwingFileName + ':' + throwingClassName + ':' + throwingMethodName; 

			bugModel = 
			{
				exceptionClassName : bug['Exception Class Name'],
				throwingFileName : bug['Throwing File Name'],
				throwingClassName : bug['Throwing Class Name'],
				throwingMethodName : bug['Throwing Method Name'],
				fullStack : combinedKey,
				versionCode : bug['App Version Code'],
				message : bug['Exception Message'],
				crashTime : bug['Crash Report Millis Since Epoch']
			}

			return bugModel;
		})
		.value();

		console.log(bugs);

		var groupedBugs = _.chain(bugs)
		.groupBy(function(item, d, t) {
			return smartName(item.fullStack);
		})
		.map()
		.sortBy("length")
		.reverse()
		.value();

		//TODO - Filter to current version only!
		groupedBugs = _.chain(groupedBugs)
		.filter(function(groupItem) 
		{
			var isPresentLive = _.some(groupItem, function(bug) {
				return (bug.versionCode >= 4400000);
			});

			console.log("isPresentLive="+isPresentLive);

			return isPresentLive;
		})
		.value();

		//Find max values
		maxCount = 0;
		minCount = Number.MAX_VALUE;

		minDate = Number.MAX_VALUE;
		maxDate = 0;

		var careAboutVersion = 4400000;

		bugPairList = [];
		uniqueBugList = [];
		groupedBugs.forEach(function(bugGroup) {
		
			bugGroupLength = bugGroup.length;

			if(bugGroupLength > maxCount) {
				maxCount = bugGroupLength;
			}

			if(bugGroupLength < minCount) {
				minCount = bugGroupLength;
			}

			sampleBug =  
			{
				message : bugGroup[0].fullStack
			}

			uniqueBugList.push(sampleBug)

			bugGroup.forEach(function(bug) {

				milliseconds = bug.crashTime;

				if(milliseconds < minDate) {
					minDate = milliseconds;
				}

				if(milliseconds > maxDate) {
					maxDate = milliseconds;
				}
				
				bugPair = 
				{ 
		           message : bug.message,
		           crashTime : bug.crashTime,
		           fullStack : bug.fullStack,
		           versionCode : bug.versionCode
				}

				   bugPairList.push(bugPair);
			});
		});

		var data = 
		{
			startDate : minDate,
		   	endDate : maxDate,
		   	uniqueList : uniqueBugList,
			pairedList : bugPairList,
			groupedList : groupedBugs
		}

		callback.dataLoaded(data);
	});
}