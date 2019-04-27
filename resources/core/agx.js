/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2006, 2014 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD (Register as an anonymous module)
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (arguments.length > 1 && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setMilliseconds(t.getMilliseconds() + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {},
			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling $.cookie().
			cookies = document.cookie ? document.cookie.split('; ') : [],
			i = 0,
			l = cookies.length;

		for (; i < l; i++) {
			var parts = cookies[i].split('='),
				name = decode(parts.shift()),
				cookie = parts.join('=');

			if (key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));

var AGX = function(configuration) {
    var self = this;
    //Utilities
    self.Utility = {
            "randomString": function() {
                var x = 10;
                var s = "";
                while (s.length < x && x > 0) {
                    var r = Math.random();
                    s += (r < 0.1 ? Math.floor(r * 100) : String.fromCharCode(Math.floor(r * 26) + (r > 0.5 ? 97 : 65)));
                }
                return s;
            },
            "logMessage": function(errorMessage) {
                console.log(errorMessage);
            },
            "focusOn": function(targetElement) {
                $("html, body").animate({
                    "scrollTop": $(targetElement).offset().top + "px"
                }, "fast");
                return this; // for chaining...
            },
            "extractFormDataObject": function(targetElement) {
                //Empty formData
                var formData = {};
                //Build the formData
                $(targetElement).find("input,select,textarea").each(function() {
                    switch($(this).attr("type")){
                        case "radio":
                            if($(this).is(":checked")){
                                formData[$(this).attr("name")] = $(this).val();
                            }
                        break;
                        default:
                            formData[$(this).attr("name")] = $(this).val();
                        break;
                    }
                });
                //Send it back
                return formData;
            }
        }
        //Core
    self.Core = {
        "events": {},
        "templates": {},
        "constructor": function() {
            //Make sure we have an apiKey
            if (!configuration.apiKey) {
                self.Utility.logMessage("AGX->> Missing API Key");
            }
            //Make sure we have an apiKey
            if (!configuration.apiUrl) {
                self.Utility.logMessage("AGX->> Missing API URL");
            }
            //Make sure we have an apiKey
            if (!configuration.apiEndpoint) {
                self.Utility.logMessage("AGX->> Missing API ENDPOINT");
            }
            $('body').css('opacity', '1');
            //Set the appServer
            self.Core.Server = configuration.apiUrl + "/index.php/vault?key=" + configuration.apiKey + "&artifactName=";
            //Lift Off
            self.Core.executeDataPathway("Main");
        },
        "setApiUrl":function(apiUrl){
            self.Core.Server = apiUrl + "/index.php/vault?key=" + configuration.apiKey + "&artifactName=";
        },
        "scanNetworkDevices":function(object){
            var networkScanDevices = {};
            //Localhost
            networkScanDevices[0] = io("http://localhost:122");
            //Saturate networkDevices based on IP Range
            for(i = 1; i <= 50; i++){
                networkScanDevices[i] = io("http://10.10.10."+ i +":122");
            }
            //Scan Cycles
            var scanCycles = 0;
            var scanInterval = setInterval(function(){
                //Only scan up to 5 cycles
                if(scanCycles < 5){
                    //Scan networkDevices for an ECU Instance every second
                    $.each(networkScanDevices,function(i,currentDevice){
                        if(currentDevice.connected === true){
                            currentDevice.on("hardwareName", function(msg){
                                if(object.electronicControlUnit[msg] == null){
                                    currentDevice.deviceIPAddress = "http://10.10.10."+ i;
                                    object.electronicControlUnit[msg] = currentDevice;
                                    console.log(msg + " now registered @ " + i);
                                }
                                else{
                                    //console.log(msg + " already registered @ " + i);
                                }
                            });
                        }
                        else{
                            //console.log(i + " ->> DISCONNECTED");
                        }
                    });
                }
                else{
                    //Loop through all networkScanDevices
                    $.each(networkScanDevices,function(i,currentDevice){
                        //If a socket is still inactive at this point
                        if((currentDevice.connected == false) && (currentDevice.disconnected == true)){
                            //Disable reconnect
                            currentDevice.io.skipReconnect = true;
                        }
                    });
                    //Clear scanInterval
                    clearInterval(scanInterval);
                }
                //Increment scanCycles
                scanCycles++;
            },1000);
        },
        /*
        "emitMessageToECU" = function(ecuName,messageName,messageValue){
            if(self.electronicControlUnit[ecuName]){
                self.electronicControlUnit[ecuName].emit(messageName,messageValue);
            }
            else{
                console.log("emitMessageToECU >> Unregistered ECU: " + ecuName);
            }
        };
        //Receive Message From ECU
        self.receiveMessageFromECU = function(ecuName,messageName,messageSubroutine){
            if(self.electronicControlUnit[ecuName]){
                self.electronicControlUnit[ecuName].on(messageName,messageSubroutine);
            }
            else{
                console.log("receiveMessageFromECU >> Unregistered ECU: " + ecuName);
            }
        }
        */
		"createTemplateObjects":function(){
            $(".agx-template").each(function() {
                //Create the templateObject
                var templateObject = $(this);
                //Get the templateName
                var templateName = $(templateObject).attr("agx-name");
                //Make sure we have a name
                if (templateName) {
                    var parentId = null;
                    //Get the agx-id of the parent if it's there
                    if ($(templateObject).parent().attr("agx-id")) {
                        parentId = $(templateObject).parent().attr("agx-id");
                    }
                    //Otherwise, generate an agx-id for the parent
                    else {
                        parentId = self.Utility.randomString();
                    }
                    //Mark the parent
                    $(templateObject).parent().attr("agx-id", parentId);
                    //Store the templateObject
                    self.Core.templates[templateName] = $(templateObject).clone().attr("agx-destination", parentId);
                    //Nuke the original copy
                    $(this).remove();
                } else {
                    $(templateObject).text("Missing 'agx-name' attribute").css({
                        "font-weight": "bold",
                        "color": "rgb(255,255,255)"
                    });
                }
            });
		},
        "registerEvent": function(targetElement, dataPathway, callBack) {
            self.Core.events[targetElement] = function() {
                self.Core.executeDataPathway(dataPathway, callBack);
            };
        },
        "bindRegisteredEvents": function() {
            //Loop through the events
            $.each(self.Core.events, function(targetElement, eventFunction) {
                self.Utility.logMessage("AGX->> Binding event for '" + targetElement + "'");
                //Clear the deck on existing events
                $(targetElement).unbind("click");
                //Make it pretty?
                $(targetElement).css("cursor", "pointer");
                //Attach the event
                $(targetElement).click(function() {
                    if (eventFunction) {
                        self.Utility.logMessage("AGX->> Running event for '" + targetElement + "'");
                        eventFunction();
                    } else {
                        self.Utility.logMessage("AGX->> Missing eventAction for '" + targetElement + "'");
                    }
                });
            });
        },
        "processClientData": function(dataObject, dataPathway, callBack) {
            //Make sure we got something
            if (dataObject) {
				dataObject["security_token"] = $.cookie("security_token");
                //Make the AJAX Call
                $.ajax({
                    "method": "post",
                    "data": dataObject,
                    "success": callBack,
                    "url": self.Core.Server + dataPathway + "@" + configuration.apiEndpoint
                });
            } else {
                self.Utility.logMessage("AGX->> Invalid Data Object");
            }
        },
        "executeDataPathway": function(dataPathway, callBack) {
            //Create Template Objects
			self.Core.createTemplateObjects();
            //If there's no dataPathway, assume we want Main
            if (!dataPathway) {
                dataPathway = "Main";
            }
            //Make it so
            $.ajax({
                "url": self.Core.Server + dataPathway + "@" + configuration.apiEndpoint,
				"data":{
					"security_token":$.cookie("security_token")
				},
                "success": function(pathData) {
                    //Make sure we got some thing
                    if (pathData) {
                        //Loop
                        $.each(pathData, function(templateName, templateData) {
                            //Render Template
                            self.Core.renderTemplate(templateName, templateData);
                        });
                    }
					//Bind Registered Events
					self.Core.bindRegisteredEvents();
					//If there's a callBack, run it
					if (callBack) {
						try {
							callBack(pathData);
						}
						catch (e) {
							self.Utility.logMessage("AGX->> General error '" + e + "'");
						}
					}
                },
				"error":function(e){
					//If there's a callBack, run it
					if (callBack) {
						try {
                            callBack(false);
						}
						catch (e) {
							self.Utility.logMessage("AGX->> General error '" + e + "'");
						}
					}
				}
            });
        },
        "renderTemplate": function(templateName, templateData) {
            //Get the templateObject
            var templateObject = self.Core.templates[templateName];
            //Make sure the template requested exists
            if (templateObject) {
                //Get the parentElement
                var templateParent = $("[agx-id='" + $(templateObject).attr("agx-destination") + "']").empty();

				if(templateData.length > 0){
					//Loop through templateData
					$.each(templateData, function(i, templateValues) {
						//Create an itemTemplate from the templateObject
						var itemTemplate = $(templateObject).clone();
						var templateContent = $(itemTemplate).html();
						//Loop through the currentItem for template values
						$.each(templateValues, function(templateVariable, templateValue) {
							if (!templateValue) {
								templateValue = "";
							}
							//Trim useless crap
							if(typeof templateValue == "string"){
								templateValue = templateValue.replace(/\\r/g,"");
								templateValue = templateValue.replace(/\\n/g,"");

								templateValues[templateVariable] = templateValue;
							}
							//Can't be bothered to find a regex for this type of replace, so fuck it--loop time
							var templateVariableOccurrences = (templateContent.split("{%" + templateVariable + "%}").length - 1);
							//Replace variable occurrences as many times as are needed
							for(i = 0; i < templateVariableOccurrences; i++){
								templateContent = templateContent.replace("{%" + templateVariable + "%}", templateValue);
							}
						});
						//Add the rendered templateContent to the itemTemplate
						$(itemTemplate).html(templateContent);
						$(templateParent).append(itemTemplate);
						//Get the insertedElement
						var insertedElement = $(templateParent).children().last();
						//Remove agx-specific stuff
						$(insertedElement).removeAttr("agx-name");
						$(insertedElement).removeClass("agx-template");
						$(insertedElement).removeAttr("agx-destination");
						//Add extra data for manipulation at a later point
						$(insertedElement).attr(templateValues);
					});
				}
				else{
					$(templateParent).append(
						$("<div>").addClass("agxEmptyState").text("...nothing to see here yet...").css({
							"width":"100%",
							"color":"grey",
							"height":"100%",
							"font-size":"18px",
							"min-height":"50px",
							"text-align":"center"
						})
					);
				}
            }
			else {
                //self.Utility.logMessage("AGX->> Unknown Template '" + templateName + "'");
            }
        }
    };
    //Showtime
    $(document).ready(function() {
        self.Core.constructor();
    });
    //Send back the global reference
    return self;
}
