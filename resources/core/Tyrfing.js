//TelemetryScreen Class
var TelemetryScreen = function() {
    //Internal Reference
    var self = this;
    self.currentECUKey = 0;
    self.iconAnimationTime = 300;
    self.iconTransitionTime = 140;
    self.meterAnimationTime = 100;
    self.animationFadeOutTime = 5000;
    self.propTextColor = "rgb(16,16,16)";
    self.propAccentColor = "rgb(16,16,16)";
    self.propMeterBackgroundColor = "rgba(255,255,255,0.1)";
    self.propLabelBackgroundColor = "rgb(255,255,255)";
    self.pairedWithHardwareAssembly = false;
    self.electronicControlUnitNames = [];
    //Empty Spotlight object
    self.Spotlight = {};
    //Instrument Cluster
    self.instrumentCluster = {};
    //Empty electronicControlUnit object
    self.electronicControlUnit = {};
    //Default Socket
    self.socket = io("http://localhost:122");
    //AGX Handle
    self.agxHandle = new AGX({
        "apiEndpoint": "Squire",
        "apiUrl": "http://localhost/asgardia.io/server",
        "apiKey": "b1e2b9023e5836857ff716271fbdc660"
    });
    //Constructor
    self.constructor = function() {
        //ECU Update
        self.agxHandle.Core.scanNetworkDevices(self);
        //Wait for ECU scan to complete
        setTimeout(function() {
            //Initialize spotlight handles
            self.initializeSpotlightHandles();
            //Initialize Plays
            self.initializePlays();
            //Initialize UI
            self.initializeDisplaySystem();
        }, 1000);
    };
    //Play
    self.TheaterPlay = function(configuration) {
        //Internal Reference
        var Play = this;
        if (configuration.name && configuration.launch) {
            //Name
            Play.playName = configuration.name;
            //Play Icon
            Play.playIcon = $("<img>").attr("src", "resources/core/images/" + Play.playName.toLowerCase() + "-offline.png");
            //Launch
            Play.launch = configuration.launch;
        }
        else {
            alert("Invalid Play Configuration");
        }
        //Send it back
        return Play;
    }
    //Set Notification
    self.setActiveECU = function(ecuName, animateChange) {
        if (self.electronicControlUnit[ecuName]) {
            //Show the active ECU name
            self.Spotlight.audience.text(">> " + ecuName + " <<");
            //Switch over the socket connection
            self.socket = self.electronicControlUnit[ecuName];

            if (animateChange == true) {
                //Animate the stage
                $("#stage").hide().slideToggle("fast");
                //Show message
                self.setNotification("ACTIVE ECU", ecuName, "WARNING");
            }

            //Bind instrument cluster
            var instrumentClusterBinder = setInterval(function() {
                if (self.electronicControlUnit[ecuName].deviceLedger) {
                    console.log(ecuName + " FINALLY BOUND");
                    //Clear Interval
                    clearInterval(instrumentClusterBinder);
                    //Loop through instrumentCluster to hide them all
                    $.each(self.instrumentCluster, function() {
                        $(this).css("visibility", "hidden");
                    });
                    //Loop through ECU's deviceLedger
                    $.each(self.electronicControlUnit[ecuName].deviceLedger, function(deviceName, deviceData) {
                        if (deviceData.position) {
                            //Bind meter to device
                            self.instrumentCluster[deviceData.position].bindSocketData(deviceName);
                            //Change Max
                            self.instrumentCluster[deviceData.position].meterMax = deviceData.max;
                            //Change label
                            self.instrumentCluster[deviceData.position].meterLabel = deviceData.label;
                            //Update to current value
                            self.instrumentCluster[deviceData.position].setValue(deviceData.deviceMessage);
                            //Show
                            $(self.instrumentCluster[deviceData.position]).css("visibility", "visible");
                        }
                    });
                }
                else {
                    console.log(ecuName + " STILL UNBOUND");
                }
            }, 100);
        }
        else {
            console.log("Set Active ECU >> Unregistered ECU: " + ecuName);
        }
    };
    //Play Video
    self.playVideo = function(url){
        //Pause Audio
        $("#squire").jPlayer("pause");
        //Change the video
        $("#cameraFeed").attr("src",url).get(0).load();
    };
    //Telemetry Cycle
    self.telemetryCycle = function(msg) {
        //Get the currentECU
        var currentECU = self.electronicControlUnitNames[self.currentECUKey];
        //Make sure we have something
        if (currentECU) {
            //Do the thing
            self.setActiveECU(currentECU, true);
        }
        //Move the currentECUKey
        if (self.currentECUKey < (self.electronicControlUnitNames.length - 1)) {
            self.currentECUKey++;
        }
        else {
            self.currentECUKey = 0;
        }
    };
    //Emit Message To ECU
    self.emitMessageToECU = function(ecuName, messageName, messageValue) {
        if (self.electronicControlUnit[ecuName]) {
            self.electronicControlUnit[ecuName].emit(messageName, messageValue);
        }
        else {
            console.log("emitMessageToECU >> Unregistered ECU: " + ecuName);
        }
    };
    //Receive Message From ECU
    self.receiveMessageFromECU = function(ecuName, messageName, messageSubroutine) {
        if (self.electronicControlUnit[ecuName]) {
            self.electronicControlUnit[ecuName].on(messageName, messageSubroutine);
        }
        else {
            console.log("receiveMessageFromECU >> Unregistered ECU: " + ecuName);
        }
    };
    //Set Notification
    self.setNotification = function(label, text, severity) {
        var borderColor;
        switch (severity) {
            case "ERROR":
                borderColor = "red";
                break;
            case "WARNING":
                borderColor = "yellow";
                break;
            default:
                borderColor = "#00aeef";
                break;
        }
        //Clear the deck
        self.Spotlight.actingArea.find(".notification").remove();
        //Container
        var container = $("<div>").addClass("row notification").css({
            "height":"43px",
            "margin-top": "7px",
            "margin-bottom": "7px"
        });
        //Top Label
        $(container).append(
            $("<div>").text(">> " + label + " <<").addClass("flicker").css("font-size", "12px")
        );
        self.Spotlight.actingArea.prepend(container);
        //Content
        var content = $("<div>").addClass("row");
        $(content).append(
            $("<div>").attr("id", "text").text(text).css({
                "border-top": "solid 1px " + borderColor,
                "border-bottom": "solid 1px " + borderColor,
                "text-transform": "none",
                "display": "none"
            })
        );
        $(container).append(content);
        //Bottom Label
        $(container).append(
            $("<div>").text(">> " + label + " <<").addClass("flicker").css("font-size", "12px")
        );
        $(".notification #text").slideToggle("fast");
        //Fade after 5 seconds
        setTimeout(function() {
            $(container).css("opacity", "0.25");
            $(".notification .flicker").removeClass("flicker").css({
                "color": "white",
                "text-shadow": "none"
            });
        }, self.animationFadeOutTime);
    };
    //Initialize Plays
    self.initializePlays = function() {
        self.TheaterPlays = {
            "ewacs": new self.TheaterPlay({
                "name": "ewacs",
                "launch": function() {
                    //Internal Reference
                    var currentPlay = self.TheaterPlays["ewacs"];
                    //Meters
                    self.instrumentCluster["EWACS"] = new self.StageProp.TextBox("EWACS", "---");
                    self.Spotlight.upStage.append(self.instrumentCluster["EWACS"]);
                    //Clicking on icon starts object tracking
                    $(currentPlay.playIcon).click(function() {
                        $("<canvas>").attr("id", "cameraTelemetry").attr("width", $("video").width()).attr("height", $("video").height()).insertAfter("video");
                        var canvas = document.getElementById("cameraTelemetry");
                        var context = canvas.getContext("2d");
                        //Wait
                        setTimeout(function() {
                            //Tracker
                            var tracker = new tracking.ColorTracker(["cyan", "magenta", "yellow"]);
                            //Attach tracker to #objectTrackerFeed
                            tracking.track("#cameraFeed", tracker, {
                                camera: true
                            });
                            //Track Event
                            tracker.on("track", function(event) {
                                try {
                                    //Hide #objectTrackerFeed
                                    $("#objectTrackerFeed").hide();
                                    //Canvas Context
                                    context.clearRect(0, 0, canvas.width, canvas.height);
                                    //Render
                                    event.data.forEach(function(rect) {
                                        if (rect.color === 'custom') {
                                            rect.color = tracker.customColor;
                                        }
                                        //Scale up to the full screen canvas
                                        rect.width = rect.width + ((rect.width / 100) * 166);
                                        rect.height = rect.height + ((rect.height / 100) * 166);
                                        rect.x = rect.x + ((rect.x / 100) * 199);
                                        rect.y = rect.y + ((rect.y / 100) * 199);

                                        context.strokeStyle = rect.color;
                                        //context.strokeStyle = "#ffa500";
                                        context.strokeRect(rect.x, rect.y, rect.width, rect.height);
                                        context.font = '12px StratumWebBold';
                                        context.fillStyle = "#fff";
                                        context.fillText("SUBJECT:", rect.x + rect.width + 5, rect.y + 11);
                                        context.fillText(rect.color.toUpperCase(), rect.x + rect.width + 5, rect.y + 22);
                                    });
                                    //Update E.W.A.C.S
                                    self.instrumentCluster["EWACS"].setValue(event.data.length);
                                    //Change Recon State
                                    if (event.data.length > 0) {
                                        //...change the icon to active
                                        $(currentPlay.playIcon).attr("src", "resources/core/images/ewacs-active.png");
                                    }
                                    else {
                                        $(currentPlay.playIcon).attr("src", "resources/core/images/ewacs-available.png");
                                    }
                                }
                                catch (e) {
                                    console.log(e);
                                }
                            });
                        }, 5000);

                    });
                }
            }),
            "navigation": new self.TheaterPlay({
                "name": "navigation",
                "launch": function() {
                    self.instrumentCluster["GPS"] = new self.StageProp.TextBox("GPS", "--,--");
                    self.Spotlight.upStage.append(self.instrumentCluster["GPS"]);
                }
            }),
            "telemetry": new self.TheaterPlay({
                "name": "telemetry",
                "launch": function() {
                    //Internal Reference
                    var currentPlay = self.TheaterPlays["telemetry"];
                    //Default Gauge
                    self.instrumentCluster["AMB"] = new self.StageProp.TextBox("AMB", "--");
                    self.Spotlight.upStage.append(self.instrumentCluster["AMB"]);
                    //Crossover L/R
                    self.instrumentCluster["CRO_L"] = new self.StageProp.HorizontalMeter("CRO_L", 0, 100, "left");
                    self.Spotlight.crossOverLeft.append(self.instrumentCluster["CRO_L"]);
                    self.instrumentCluster["CRO_R"] = new self.StageProp.HorizontalMeter("CRO_R", 0, 100, "right")
                    self.Spotlight.crossOverRight.append(self.instrumentCluster["CRO_R"]);
                    //Stage L/R
                    self.instrumentCluster["STA_L"] = new self.StageProp.VerticalMeter("STA_L", 0, 100, "left");
                    self.Spotlight.stageLeft.append(self.instrumentCluster["STA_L"]);
                    self.instrumentCluster["STA_R"] = new self.StageProp.VerticalMeter("STA_R", 0, 100, "right")
                    self.Spotlight.stageRight.append(self.instrumentCluster["STA_R"]);
                    //Off L/R
                    self.instrumentCluster["OFF_L"] = new self.StageProp.VerticalMeter("OFF_L", 0, 100, "left")
                    self.Spotlight.offLeft.append(self.instrumentCluster["OFF_L"]);
                    self.instrumentCluster["OFF_R"] = new self.StageProp.VerticalMeter("OFF_R", 0, 100, "right")
                    self.Spotlight.offRight.append(self.instrumentCluster["OFF_R"]);
                    //Downstage
                    self.instrumentCluster["DST_1"] = new self.StageProp.TextBox("DST_1", 0);
                    self.Spotlight.apron.append(self.instrumentCluster["DST_1"]);
                    self.instrumentCluster["DST_2"] = new self.StageProp.TextBox("DST_2", 0);
                    self.Spotlight.apron.append(self.instrumentCluster["DST_2"]);
                    self.instrumentCluster["DST_3"] = new self.StageProp.TextBox("DST_3", 0)
                    self.Spotlight.apron.append(self.instrumentCluster["DST_3"]);
                    self.instrumentCluster["DST_4"] = new self.StageProp.TextBox("DST_4", 0)
                    self.Spotlight.apron.append(self.instrumentCluster["DST_4"]);
                    //Clicking on icon reloads
                    $(currentPlay.playIcon).click(function() {
                        window.location.reload();
                    });
                }
            }),
            "data": new self.TheaterPlay({
                "name": "data",
                "launch": function() {
                    //Internal Reference
                    var currentPlay = self.TheaterPlays["data"];
                    //Total Number of ECUs
                    var totalNumberOfECUs = Object.keys(self.electronicControlUnit).length;
                    var ecuCount = new self.StageProp.TextBox("ECU #", 0);
                    ecuCount.setValue(totalNumberOfECUs);
                    self.Spotlight.upStage.append(ecuCount);
                    //Click sends location update to ACHIRAL-60
                    $(currentPlay.playIcon).click(function(){
                        navigator.geolocation.getCurrentPosition(
                            //Success
                            function(position) {
                                // Do magic with location
                                startPos = position;
                                self.instrumentCluster["GPS"].setValue(startPos.coords.latitude.toFixed(1) + "," + startPos.coords.longitude.toFixed(1));
                                //Update ACHIRAL
                                io("http://api.asgardia.io:122").emit("setLocationCoordinates", startPos.coords.latitude + "," + startPos.coords.longitude);
                            },
                            //Failure
                            function(error) {
                                self.setNotification("LOCATION PROCESSING ERROR", error.message, "ERROR");
                            }
                        );
                    });
                    //If we have ECUs on deck...
                    if (totalNumberOfECUs > 0) {
                        //...change the icon to active
                        $(currentPlay.playIcon).attr("src", "resources/core/images/data-available.png");
                        //Loop through them
                        $.each(self.electronicControlUnit, function(ecuName, ecuHandle) {
                            //Update Hardware Data
                            self.electronicControlUnit[ecuName].on("hardwareData", function(hardwareData) {
                                try {
                                    var deviceLedger = JSON.parse(hardwareData.deviceLedger);
                                    self.electronicControlUnit[ecuName].deviceLedger = deviceLedger;
                                    //Update electronicControlUnitNames
                                    self.electronicControlUnitNames = Object.keys(self.electronicControlUnit);
                                    //Find SMD/MAGI-60's key
                                    var MAGI_60_Key = self.electronicControlUnitNames.findIndex(function(element) {
                                        return element == "FENRIS ENTERPRISE SMD/MAGI-60";
                                    });
                                    //Remove SMD/MAGI-60 from this list (has no virtual hardware assemblies yet)
                                    self.electronicControlUnitNames.splice(MAGI_60_Key, 1);
                                }
                                catch (e) {
                                    //Nothing we can do about this; randomly happens when the JSON is fucked up due to a wierd hardware value in the ECU.
                                }
                            });
                            //If it's SMD/MAGI-60...
                            if (ecuName == "FENRIS ENTERPRISE SMD/MAGI-60") {
                                //...set self.agxHandle API URL to the right address
                                self.agxHandle.Core.setApiUrl(self.electronicControlUnit["FENRIS ENTERPRISE SMD/MAGI-60"].deviceIPAddress + "/asgardia.io/server");
                                //...listener for changing the ECU to whatever SMD/MAGI-60 deemed appropiate
                                self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/MAGI-60", "setActiveECU", function(ecuName) {
                                    //Do the thing
                                    self.setActiveECU(ecuName, true);
                                });
                            }
                            //If it's SMD/TYRFING-20...
                            if (ecuName == "FENRIS ENTERPRISE SMD/TYRFING-20") {
                                console.log("Binding UI Harness to Hardware Assembly...", ecuName);
                                //..then we're connected to the hardware component of this UI Harness, so pair with it once
                                if (self.pairedWithHardwareAssembly == false) {
                                    //Therefore, we need to listen for special events from the hardware assembly that control this UI Harness. Nyah.
                                    //telemetryCyle button
                                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/TYRFING-20", "telemetryCyle", function(){
                                        self.telemetryCycle();
                                    });
                                    //telemetryRecord button
                                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/TYRFING-20", "telemetryRecord", function() {

                                    });
                                    //telemetryUpload button
                                    console.log("> Registering telemetryCyle button...");
                                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/TYRFING-20", "telemetryUpload", function() {

                                    });
                                    //telemetryDelete button
                                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/TYRFING-20", "telemetryDelete", function() {

                                    });
                                    //Mark the fact we've pairedWIthHardwareAssembly
                                    self.pairedWithHardwareAssembly = true;
                                    //Show notification
                                    self.setNotification("ACTIVE ECU", "UI Harness bound to SMD/TYRFING-20 @ " + Tyrfing.electronicControlUnit["FENRIS ENTERPRISE SMD/TYRFING-20"].deviceIPAddress, "INFO");
                                }
                            }
                        });
                    }
                }
            }),
            "mode": new self.TheaterPlay({
                "name": "mode",
                "launch": function() {
                    self.instrumentCluster["MODE"] = new self.StageProp.TextBox("MODE", "NORMAL");
                    self.Spotlight.upStage.append(self.instrumentCluster["MODE"]);
                    self.instrumentCluster["UST_1"] = new self.StageProp.TextBox("UST_1", "---");
                    self.Spotlight.upStage.append(self.instrumentCluster["UST_1"]);
                    self.instrumentCluster["UST_2"] = new self.StageProp.TextBox("UST_2", "---");
                    self.Spotlight.upStage.append(self.instrumentCluster["UST_2"]);
                }
            }),
            "magi": new self.TheaterPlay({
                "name": "magi",
                "launch": function() {
                    //Internal Reference
                    var Magi = self;
                    //Now Playing Meter
                    Magi.NowPlayingMeter = new self.StageProp.WideTextBox("MEDIA", "---");
                    self.Spotlight.apron.append(Magi.NowPlayingMeter);

                    /* -- Telemetry UI Harness Draft --
                    Tyrfing.electronicControlUnit["FENRIS ENTERPRISE SMD/ACHIRAL-60"] = io("http://api.asgardia.io:122");
                    Tyrfing.electronicControlUnit["FENRIS ENTERPRISE SMD/ACHIRAL-60"].on("log",function(messageData){
                        //Convert to JSON
                    	var messageData = JSON.parse(messageData);
                        var messageParts = messageData.message.split(".");
                        //Switch statement to handle different blades
                    	switch(messageData.blade){
                            case "PROCESSOR":
                                //Find the triggered Processor
                                var processorId = messageParts[0];
                                console.log(processorId);
                                $("img#" + processorId).attr("src","resources/core/images/processor-active.png");
                                setTimeout(function(){
                                    $("img#" + processorId).attr("src","resources/core/images/processor-inactive.png");
                                },500);
                            break;
                            case "DECISION_ENGINE":
                                var messageParts = messageData.message.split(" ->>");
                                //Find the triggered neural net in the hive
                                var processorId = messageParts[0];
                                console.log(processorId);
                                $("img#" + processorId).attr("src","resources/core/images/processor-active.png");
                                setTimeout(function(){
                                    $("img#" + processorId).attr("src","resources/core/images/processor-inactive.png");
                                },500);
                            break;
                    	}
                    });

                    self.Spotlight.actingArea.append(
                        $("<div>").load("resources/ui-harness/telemetry.htm",function(){

                        })
                    );
                    -- Telemetry UI Harness Draft -- */
                    //Create the audioChannel element
                    Magi.audioChannel = $("<div>").attr("id", "squire");
                    //Add to the page
                    $("#stage").append(Magi.audioChannel);
                    //Create an instance of the audioChannel's jPlayer whatever
                    $(Magi.audioChannel).jPlayer({
                        "supplied": "mp3",
                        "cssSelectorAncestor": "squire",
                        "swfPath": "http://www.raynottcroft.com/tyrfing/resources/core/"
                    });
                    //Bind the ended event
                    $(Magi.audioChannel).bind($.jPlayer.event.ended, function() {
                        //Update the playCount
                        self.agxHandle.Core.executeDataPathway("updateMediaPlayCount:" + Magi.currentSong.playCountRecordId, function(response) {
                            //Another!
                            Magi.extractNextSong();
                        });
                    });
                    //Get rid of jPlayer div
                    $("#jp_poster_0").closest("#default").css("background", "rgba(0,0,0,0)");
                    //Extract Next Song
                    Magi.extractNextSong = function() {
                        //Only try to grab new data if communication is available
                        if (self.electronicControlUnit["FENRIS ENTERPRISE SMD/MAGI-60"]) {
                            self.emitMessageToECU("FENRIS ENTERPRISE SMD/MAGI-60", "extractNextSong", "DO THE THING!");
                        }
                    };
                    //Clicking the meter extracts another song
                    Magi.NowPlayingMeter.click(Magi.extractNextSong);
                    //After 3 seconds...
                    setTimeout(function() {
                        //Auto-play
                        Magi.extractNextSong();
                    }, 3000);
                    //Next Video Data
                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/MAGI-60", "nextVideoData", function(msg) {
                        //Current Video
                        Magi.currentVideo = JSON.parse(msg);
                        //Play Video
                        self.playVideo(Magi.currentVideo.mediaUrl);
                    });
                    //Next Song Data
                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/MAGI-60", "nextSongData", function(msg) {
                        //Current Song
                        Magi.currentSong = JSON.parse(msg);
                        //Play Music
                        $(Magi.audioChannel).jPlayer("setMedia", {
                            "mp3": Magi.currentSong.mediaUrl
                        });
                        //Play
                        $(Magi.audioChannel).jPlayer("play");
                        //Show on NowPlaying
                        Magi.NowPlayingMeter.setValue(Magi.currentSong.mediaName);
                    });
                    //Next Song
                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/MAGI-60", "nextSong", function(msg) {
                        Magi.extractNextSong();
                    });
                    //Stealth
                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/MAGI-60", "stealthMode", function(state) {
                        if(state == 100){
                            $(Magi.audioChannel).jPlayer("pause");
                            //Show message
                            self.setNotification("STEALTH MODE","ENGAGED", "ERROR");
                        }
                        else{
                            $(Magi.audioChannel).jPlayer("play");
                            //Show message
                            self.setNotification("STEALTH MODE","DISENGAGED", "WARNING");
                        }
                    });
                    //Extract Mandate
                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/MAGI-60", "extractMandate", function(msg) {
                        if (parseInt(msg) > 50) {
                            Magi.extractMandate();
                        }
                    });
                    //Reboot
                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/MAGI-60", "reboot", function(msg) {
                        //window.location.reload();
                        self.telemetryCycle();
                    });
                    //Log
                    self.receiveMessageFromECU("FENRIS ENTERPRISE SMD/MAGI-60", "log", function(msg) {
                        var targetAvatar = null;
                        var logMessage = JSON.parse(msg);
                        //Set targetAvatar for each blade
                        switch (logMessage.blade) {
                            case "EWACS":
                                targetAvatar = $(self.Spotlight.crossOverMiddle.find(".magiActivity").get(0));
                                break;
                            case "DECISION_ENGINE":
                                targetAvatar = $(self.Spotlight.crossOverMiddle.find(".magiActivity").get(1));
                                break;
                            case "PROCESSOR":
                                targetAvatar = $(self.Spotlight.crossOverMiddle.find(".magiActivity").get(2));
                                break;
                        }
                        //Blink the targetAvatar
                        $(targetAvatar).removeClass("fa-circle-o").addClass("fa-circle");
                        //Fade after half a second
                        setTimeout(function() {
                            $(targetAvatar).removeClass("fa-circle").addClass("fa-circle-o");
                        }, 500);

                        if (typeof logMessage.message == "object") {
                            logMessage.message = logMessage.message.text;
                        }

                        if ((logMessage.blade.search("DECISION_ENGINE") > -1)) {
                            //Show the message
                            self.setNotification(logMessage.blade, logMessage.message, logMessage.severity);
                        }
                        else {
                            //console.log(logMessage);
                            if (logMessage.severity != "INFO") {
                                //Show the message
                                self.setNotification(logMessage.blade, logMessage.message, logMessage.severity);
                            }
                        }
                    });

                }
            })
        };
    };
    //Initialize handles for the stage's areas
    self.initializeSpotlightHandles = function() {
        $("#stage").find(".spotlight").each(function() {
            //Get the areaIdentifier
            var areaIdentifier = $(this).attr("id");
            //Make sure we got something
            if (areaIdentifier) {
                self.Spotlight[areaIdentifier] = $(this);
            }
        });
    };
    //Initialize Display System
    self.initializeDisplaySystem = function() {
        self.launchedPerformances = 0;
        //Execute Launch Sequence
        setTimeout(function() {
            var i = 0;
            //Make sure we have something
            $.each(self.TheaterPlays, function(j, currentPlay) {
                //Pre-animation state
                $(currentPlay.playIcon).css({
                    "top": "0%",
                    "margin": "1%",
                    "width": "100%",
                    "position": "relative"
                });
                //Add the playIcon to the #actingArea
                $("#actingArea").append(currentPlay.playIcon);
                //1 - Animate from "outta nowhere" and shrink to the center
                setTimeout(function() {
                    $(currentPlay.playIcon).animate({
                            "width": "64px",
                            "left": "0%",
                            "top": "10%"
                        },
                        self.iconTransitionTime, "swing",
                        function() {
                            //2 - Animate from center towards the bottom
                            $(currentPlay.playIcon).animate({
                                "top": "100%"
                            }, self.iconTransitionTime, "swing", function() {
                                //3 - Animate from bottom to #houseLeft or #houseRight
                                if (self.launchedPerformances < 3) {
                                    $("#houseLeft").append($(currentPlay.playIcon).css("top", "0%"));
                                }
                                else {
                                    $("#houseRight").append($(currentPlay.playIcon).css("top", "0%"));
                                }
                                //Launch in sequence
                                setTimeout(function() {
                                    try {
                                        currentPlay.launch();
                                    }
                                    catch (e) {
                                        console.log(currentPlay.playName, e);
                                    }
                                }, self.iconAnimationTime);
                                //Count how many we've launched
                                self.launchedPerformances++;
                                //Flicker
                                if (self.launchedPerformances == Object.keys(self.TheaterPlays).length) {
                                    //Defaults to first available ECU
                                    for (ecuName in self.electronicControlUnit) {
                                        if (ecuName != "FENRIS ENTERPRISE SMD/MAGI-60") {
                                            self.setActiveECU(ecuName);
                                            break;
                                        }
                                    }
                                    //Notice
                                    self.setNotification("Telemetry UI Harness", "FENRIS ENTERPRISE SMD/TYRFING-20 (Mark II)", "INFO");
                                    //Flicker
                                    setInterval(function() {
                                        $(".flicker").each(function() {
                                            if ($(this).attr("on") == "true") {
                                                $(this).attr("on", "false").css("color", "white");
                                            }
                                            else {
                                                $(this).attr("on", "true").css("color", "black");
                                            }
                                        });
                                    }, 150);
                                    //Visual Processing
                                    //Get User Media
                                    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
                                    //Make sure we got something
                                    if (navigator.getUserMedia) {
                                        //Start video processing
                                        navigator.getUserMedia({"video": true},function(stream) {
                                                $("body").css("background", "none");
                                                document.querySelector("#cameraFeed").src = window.URL.createObjectURL(stream);
                                            },
                                            function(e) {
                                                self.setNotification("VISUAL PROCESSING ERROR", e, "ERROR");
                                            }
                                        );
                                    }
                                    else {
                                        self.setNotification("VISUAL PROCESSING ERROR", "Optical hardware/software unavailable", "ERROR");
                                    }
                                }
                            });
                        });
                }, (self.iconAnimationTime * i));
                i++;
            });
        }, 1000);
    };
    //Stage Props (widgets)
    self.StageProp = {
        "TextBox": function(textLabel, textValue) {
            //Internal reference
            var TextBox = $("<div>").addClass("textBox").css({
                "float": "left",
                "width": "13%",
                "height": "24px",
                "display": "inline",
                "overflow": "hidden",
                "margin-left": "8px",
                "background": self.propMeterBackgroundColor,
                "border-radius": "3px",
                "border": "solid 1px " + self.propLabelBackgroundColor
            });
            //Better for wide screens
            if($(window).width() > 1300){
                $(TextBox).width("13.5%");
            }

            //Constructor
            TextBox.constructor = function() {
                //Label
                $(TextBox).append(
                    TextBox.label = $("<div>").addClass("meterLabel").html(textLabel).css({
                        "width": "49%",
                        "float": "left",
                        "color": self.propTextColor,
                        "display": "inline",
                        "overflow": "hidden",
                        "padding-top": "2px",
                        "padding-left": "2px",
                        "padding-right": "2px",
                        "font-weight": "bold",
                        "height": "100%",
                        "background": self.propLabelBackgroundColor
                    })
                );
                //Content
                $(TextBox).append(
                    TextBox.content = $("<div>").addClass("meterContent").html(textValue).css({
                        "float": "left",
                        "width": "45%",
                        "display": "inline",
                        "padding-top": "2px",
                        "padding-left": "2px",
                        "padding-right": "2px",
                        "text-shadow":"1px 1px black",
                        "height": "100%",
                        "overflow": "hidden",
                        "background": "none"
                    })
                );
                //Keep UI uncluttered until needed
                //$(TextBox).css("opacity","0.12");
            }
            //Bind Socket Data
            TextBox.bindSocketData = function(socketDataSource, postProcessor) {
                self.socket.on(socketDataSource, function(msg) {
                    TextBox.setValue(msg);
                    if (postProcessor) {
                        postProcessor(msg);
                    }
                });
                return TextBox;
            }
            //Get Value
            TextBox.getValue = function() {
                return TextBox.value;
            }
            //Set Value
            TextBox.setValue = function(textValue) {
                TextBox.value = textValue;
                $(TextBox.content).html(textValue);
                //In case the meterLabel has changed
                if (TextBox.meterLabel) {
                    $(TextBox.label).html(TextBox.meterLabel);
                }
                //Show up
                $(TextBox).css("opacity", "1");
                //Fade after 5 seconds
                /*
                setTimeout(function() {
                    $(TextBox).css("opacity", "0.12");
                }, self.animationFadeOutTime);
                */
            }
            //Showtime
            TextBox.constructor();
            //Send it back
            return TextBox;
        },
        "WideTextBox": function(textLabel, textValue) {
            //Internal reference
            var WideTextBox = $("<div>").addClass("wideTextBox").css({
                "float": "left",
                "width": "41.5%",
                "height": "24px",
                "display": "inline",
                "overflow": "hidden",
                "margin-left": "3px",
                "border-radius": "3px",
                "background": self.propMeterBackgroundColor,
                "border": "solid 1px " + self.propLabelBackgroundColor
            });
            //Constructor
            WideTextBox.constructor = function() {
                //Label
                $(WideTextBox).append(
                    WideTextBox.label = $("<div>").addClass("meterLabel").html(textLabel).css({
                        "float": "left",
                        "width": "20%",
                        "height": "100%",
                        "display": "inline",
                        "overflow": "hidden",
                        "color": self.propTextColor,
                        "height": "100%",
                        "background": self.propLabelBackgroundColor
                    })
                );
                //Content
                $(WideTextBox).append(
                    WideTextBox.content = $("<marquee>").addClass("meterContent").attr("behavior", "left").html(textValue).css({
                        "float": "left",
                        "display": "inline",
                        "overflow": "hidden",
                        "text-shadow":"1px 1px black",
                        "width": "80%",
                        "height": "100%",
                        "background": "none"
                    })
                );
                //Keep UI uncluttered until needed
                //$(WideTextBox).css("opacity","0.12");
            }
            //Bind Socket Data
            WideTextBox.bindSocketData = function(socketDataSource, postProcessor) {
                self.socket.on(socketDataSource, function(msg) {
                    if (postProcessor) {
                        msg = postProcessor(msg);
                    }

                    WideTextBox.setValue(msg);
                });
                return WideTextBox;
            }
            //Get Value
            WideTextBox.getValue = function() {
                return WideTextBox.value;
            }
            //Set Value
            WideTextBox.setValue = function(textValue) {
                WideTextBox.value = textValue;
                $(WideTextBox.content).html(textValue);
                //Show up
                $(WideTextBox).css("opacity", "1");
                //Fade after 5 seconds
                /*
                setTimeout(function() {
                    $(WideTextBox).css("opacity", "0.12");
                }, self.animationFadeOutTime);
                */
            }
            //Showtime
            WideTextBox.constructor();
            //Send it back
            return WideTextBox;
        },
        "VerticalMeter": function(meterLabel, meterValue, meterMax, alignment) {
            if (!alignment) {
                alignment = "left";
            }
            //Internal reference
            var VerticalMeter = $("<div>").css({
                "float": alignment,
                "height": "98%",
                "width": "64px",
                "display": "inline",
                "overflow": "hidden"
            });
            //Constructor
            VerticalMeter.constructor = function() {
                //Store the meterMax
                VerticalMeter.meterMax = meterMax;
                //Store the meterLabel
                VerticalMeter.meterLabel = meterLabel;
                VerticalMeter.container = $("<div>").css({
                    "width": "98%",
                    "float": "left",
                    "height": "98%",
                    "display": "inline",
                    "overflow": "hidden",
                    "-ms-transform": "rotate(180deg)",
                    "-moz-transform": "rotate(180deg)",
                    "-webkit-transform": "rotate(180deg)"
                });
                //Add ruler
                $(VerticalMeter).append(
                    VerticalMeter.label = $("<div>").css({
                        "width": "100%",
                        "height": "20px",
                        "font-size": "10px",
                        "text-align":"center",
                        "overflow": "hidden"
                    })
                );
                //Add ruler
                $(VerticalMeter.container).append(
                    VerticalMeter.ruler = $("<div>").css({
                        "width": "1%",
                        "float": "left",
                        "height": "100%",
                        "diplay": "inline",
                        "margin-left": "50%",
                        "border-radius": "3px",
                        "border-left": "solid 18px " + self.propMeterBackgroundColor
                    })
                );
                //Add indicator
                $(VerticalMeter.container).append(
                    VerticalMeter.indicator = $("<div>").css({
                        "width": "20%",
                        "left": "-25%",
                        "float": "left",
                        "height": "20px",
                        "display": "inline",
                        "position": "relative",
                        "background": self.propLabelBackgroundColor
                    })
                );
                $(VerticalMeter).append(VerticalMeter.container);
                //Set the value
                VerticalMeter.setValue(meterValue);
                //Keep UI uncluttered until needed
                //$(VerticalMeter).css("opacity","0.12");
            }
            //Bind Socket Data
            VerticalMeter.bindSocketData = function(socketDataSource, postProcessor) {
                self.socket.on(socketDataSource, function(msg) {
                    if (postProcessor) {
                        msg = postProcessor(msg);
                    }
                    VerticalMeter.setValue(msg);
                });
                return VerticalMeter;
            }
            //Get Value
            VerticalMeter.getValue = function() {
                return VerticalMeter.value;
            }
            //Set Value
            VerticalMeter.setValue = function(meterValue) {
                //Determine meterHeight
                var meterHeight = (meterValue / VerticalMeter.meterMax) * 100;
                //Cap top
                if (meterHeight > 100) {
                    meterHeight = 100;
                }
                //Cap bottom
                if (meterHeight < 0) {
                    meterHeight = 0;
                }
                //Store the value
                VerticalMeter.value = meterValue;
                //Set the new height
                //$(VerticalMeter.indicator).height(meterHeight + "%");
                $(VerticalMeter.indicator).animate({
                    "height": meterHeight + "%"
                }, self.meterAnimationTime, function() {
                    //Update the label
                    $(VerticalMeter.label).html(Math.ceil(meterValue) + " " + VerticalMeter.meterLabel);
                });
                //Show up
                $(VerticalMeter).css("opacity", "1");
                //Fade after 5 seconds
                /*
                setTimeout(function() {
                    $(VerticalMeter).css("opacity", "0.12");
                }, self.animationFadeOutTime);
                */
            }
            //Showtime
            VerticalMeter.constructor();
            //Send it back
            return VerticalMeter;
        },
        "HorizontalMeter": function(meterLabel, meterValue, meterMax, alignment) {
            //Internal reference
            var HorizontalMeter = $("<div>").css({
                "width": "99%",
                "height": "24px",
                "margin-top": "4px",
                "margin-bottom": "8px",
                "float": alignment,
                "display": "inline",
                "text-align": alignment,
                "border-radius": "3px",
                "border": "solid 1px " + self.propLabelBackgroundColor,
                "background": self.propMeterBackgroundColor,
            });

            //Constructor
            HorizontalMeter.constructor = function() {
                //Store the meterMax
                HorizontalMeter.meterMax = meterMax;
                //Store the meterLabel
                HorizontalMeter.meterLabel = meterLabel;
                //Add label
                $(HorizontalMeter).append(
                    HorizontalMeter.label = $("<div>").css({
                        "width": "24%",
                        "height": "100%",
                        "float": alignment,
                        "color": self.propTextColor,
                        "display": "inline",
                        "overflow": "hidden",
                        "text-align": "center",
                        "background": self.propLabelBackgroundColor
                    })
                );
                HorizontalMeter.container = $("<div>").css({
                    "float": alignment,
                    "width": "76%",
                    "height": "100%",
                    "display": "inline",
                    "overflow": "hidden"
                });
                //Add ruler
                $(HorizontalMeter.container).append(
                    HorizontalMeter.ruler = $("<div>").css({
                        "width": "100%",
                        "height": "100%",
                        "float": alignment,
                        "diplay": "inline"
                    })
                );
                //Add indicator
                $(HorizontalMeter.ruler).append(
                    HorizontalMeter.indicator = $("<div>").css({
                        "width": "7px",
                        "float": alignment,
                        "height": "100%",
                        "display": "inline",
                        "position": "relative",
                        "background": self.propLabelBackgroundColor
                    })
                );
                //Add the meter to the parent
                $(HorizontalMeter).append(HorizontalMeter.container);
                //Eyecandy
                $(HorizontalMeter).append(
                    $("<div>").css({
                        "width": "25%",
                        "height": "12px",
                        "float": alignment,
                        "diplay": "inline"
                    })
                );
                $(HorizontalMeter).append(
                    $("<div>").html("&bull;     &bull;     &bull;     &bull;").css({
                        "width": "75%",
                        "height": "20px",
                        "font-size": "18px",
                        "float": alignment,
                        "diplay": "inline",
                        "text-shadow": "none"
                    })
                );
                //Set the value
                HorizontalMeter.setValue(meterValue);
                //Keep UI uncluttered until needed
                //$(HorizontalMeter).css("opacity","0.12");
            }
            //Bind Socket Data
            HorizontalMeter.bindSocketData = function(socketDataSource) {
                self.socket.on(socketDataSource, function(msg) {
                    HorizontalMeter.setValue(msg);
                });
                return HorizontalMeter;
            }
            //Get Value
            HorizontalMeter.getValue = function() {
                return HorizontalMeter.value;
            }
            //Set Value
            HorizontalMeter.setValue = function(meterValue) {
                //Determine meterHeight
                var meterHeight = (meterValue / HorizontalMeter.meterMax) * 100;
                //Cap top
                if (meterHeight > 100) {
                    meterHeight = 100;
                }
                //Cap bottom
                if (meterHeight < 0) {
                    meterHeight = 0;
                }
                //Store the value
                HorizontalMeter.value = meterValue;
                //Set the new height
                //$(HorizontalMeter.indicator).width(meterHeight + "%");
                $(HorizontalMeter.indicator).animate({
                    "width": meterHeight + "%"
                }, self.meterAnimationTime, function() {
                    //Update the label
                    $(HorizontalMeter.label).html(Math.ceil(meterValue) + " " + HorizontalMeter.meterLabel);
                });
                //Show up
                $(HorizontalMeter).css("opacity", "1");
                //Fade after 5 seconds
                /*
                setTimeout(function() {
                    $(HorizontalMeter).css("opacity", "0.12");
                }, self.animationFadeOutTime);
                */
            };
            //Showtime
            HorizontalMeter.constructor();
            //Send it back
            return HorizontalMeter;
        }
    };
    //Showtime
    $(document).ready(self.constructor);
};
//Instance
var Tyrfing = new TelemetryScreen();
