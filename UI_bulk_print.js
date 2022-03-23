// gs.hasRole("admin")
var model_text = null;

function message(func) {
    //alert(func + ' function firing');
}

function printZebraLabel() {
    message('printZebraLabel');
    try {
        ScriptLoader.getScripts('BrowserPrint.jsdbx', function() {});

        // Using Zebra Browser Print
        var labelText = "";
        var available_printers = null;
        var selected_category = null;
        var default_printer = null;
        var selected_printer = null;
        var format_start = "^XA^LL254^FO80,0^A0N,50,10^FD";
        /***************************************************
        (USE ZPL II Programming Guide from Zebra) for code definitions
        ***************************************************/
        var format_end = "^FS^XZ";
        var default_mode = true;

        // Check if printing is triggered from the form or the list view
        var sysIds = [];

        //Load BrowserPrint script
        if (typeof g_list !== 'undefined') {
            var checked = g_list.getChecked();

            if (checked) {
                sysIds = g_list.getChecked().split(",");
            } else {
                alert('No assets were selected.  Please place checkmark next to asset to print barcode.');
            }
        }

        // Check if default printer is set
        jslog("Connecting to default Zebra printer...");

        //Check if running from List View.  If so, load BrowserPrint function then call Browserprint
        if (sysIds.length > 0) {
            BrowserPrint.getDefaultDevice("printer", foundDevice, deviceError);
        }

    } catch (err) {
        jslog('A JavaScript runtime error occurred: ' + err.message);

    }

    function userCallback(response) {
        try {
            message('userCallback');
            var answer = response.responseXML.documentElement.getAttribute("answer");
            answer = answer.evalJSON();

            if (answer) {
                // jslog("Printing barcode with values: Model = " + answer.model.displayValue + ", Serial no: " +  answer.serial_number.value);
                jslog("Printing barcode with values: Model: " + answer.model + ", Serial no: " + answer.serial + ", Asset Tag: " + answer.asset);
                
				//Troubleshooting alerts

                // printLabel(answer.model.displayValue, answer.serial_number.value);
                //printLabel(answer.model.Value, answer.serial_number.value, answer.asset_tag.value);
                printLabel(answer.model, answer.serial, answer.asset);
            } else {
                alert('No answer');
            }
        } catch (err) {
            jslog('A JavaScript runtime error occurred: ' + err.message);
        }
    }

    function printLabel(model, serial, asset) { //function printLabel(model, serial, asset)
        //messsage('printLabel');
        try {
            // Create Zebra label using ZPL language- Reference Zebra ZPLII Programming Guide
            labelText = "^XA"; // Start command for label
            labelText += "^CF0,16"; //Set font on label  Use Font 0 - Scalable font.  16 is height in dots
            labelText += "^FB450,2,,^FO25,130^FDModel: " + model + "^FS"; // Place Model: ${model} on label
            //FB = Field Block. 450 = width of field (dots), 2 = max lines in block
            //FO = Field Origin.  25 = x-axis location (dots), 130 = y-axis location (dots)
            labelText += "^FO25,110^FDSerial #: " + serial + "^FS"; // Place Serial: ${serial} on label
            //FO = Field Origin. 25 = x-axis location (dots), 110 = y-axis location (in dots)
            labelText += "^BY2,2.2,35^FT45,75,0^B3N,N,,Y,N"; // Set barcode format
            //BY = Bar Code Field.  2 = Module width in dots, 2.2 = wide bar to narrow bar ratio, 35 = bar code height
            //FT = Sets field position relative to home position designated in ^LH.  45 = x-axis location, 75 = y-axis location, 0 = left justified
            //B3 = Code 39 Barcode.  
            //N=Normal orientation, N=no Mod-43 check digit, Y=Yes print interpretation line, N=Don't print interpretation code above barcode
            labelText += "^FD" + asset + "^FS"; // Assign asset tag to barcode
            //FD = Defines field data string
            //FS = End of field data string
            labelText += "^PQ1,0,0,Y^XZ"; // configure print quality and close print command
            //PQ = Print quality.  1=total quantity of labels to print, 0=pause to cut, 0=number of replicates,y=error label
            //XZ = Ending/Closing bracket
            selected_printer.send(labelText, printComplete, printerError);
        } catch (err) {
            jslog('A JavaScript runtime error occurred: ' + err.message);
        }
    }

    function foundDevice(printer) {
        message('foundDevice');
        try {
            default_printer = printer;
            if ((printer != null) && (printer.connection != undefined)) {
                selected_printer = printer;
                jslog("Found Zebra printer: " + printer.name + " connected via: " + printer.connection);
                // Check if printing is triggered from the form or the list view
                //alert("There are " + sysIds.length + " in the sysId variable");
                if (sysIds.length > 0) {
                    for (var i = 0; i < sysIds.length; i++) {
                        //alert("Processing record " + i +" which is sysId: " + sysIds[i]);
                        var ga = new GlideAjax('FGSUtils');
                        ga.addParam('sysparm_name', 'ajaxClientDataHandler');
                        ga.addParam('sysparm_tablename', 'alm_asset'); // Table name
                        ga.addParam('sysparm_sysid', sysIds[i]); // Sysid
                        // ga.addParam('sysparm_fieldnames','model,serial_number'); // Field names we want to retrieve
                        // ga.addParam('sysparm_fieldnames','model,serial_number,asset_tag'); // Field names we want to retrieve (updated)
                        ga.addParam('sysparm_fieldnames', 'u_asset_name,serial_number,asset_tag'); // Field names we want to retrieve
                        ga.getXML(userCallback);
                    }
                } else {
                    //printLabel(g_form.getDisplayValue('model'), g_form.getValue('serial_number'));
                    var model_value = g_form.getReference('model');
                    var model_text = model_value.name;
                    //printLabel(g_form.getValue('model'), g_form.getValue('serial_number'), g_form.getValue('asset_tag'));
                    printLabel(model_text, g_form.getValue('serial_number'), g_form.getValue('asset_tag'));
                }

            } else {
                alert("No default Zebra printer is configured. Please right-click on Zebra Browser Print icon in system tray and set a default Zebra printer.");
            }

        } catch (err) {
            jslog('A JavaScript runtime error occurred: ' + err.message);
        }
    }

    function deviceError(errorMessage) {
        try {
            alert("An error occured while attempting to connect to your Zebra Printer. You may not have Zebra Browser Print installed, installed SSL certificate or it may not be running. Install Zebra Browser Print, or start the Zebra Browser Print Service, and try again! Error message: " + errorMessage);

        } catch (err) {
            jslog('A JavaScript runtime error occurred: ' + err.message);
        }
    }

    function sendData() {
        jslog("Printing on Zebra...");
        message('sendData');
        selected_printer.send(format_start + labelText + format_end, printComplete, printerError);

        checkPrinterStatus(function(text) {
            if (text == "Ready to Print") {
                selected_printer.send(format_start + labelText + format_end, printComplete, printerError);
            } else {
                printerError(text);
            }
        });

    }

    function checkPrinterStatus(finishedFunction) {
        message('checkPrinterStatus');
        selected_printer.sendThenRead("~HQES",
            function(text) {
                var that = this;
                var statuses = [];
                var ok = false;
                var is_error = text.charAt(70);
                var media = text.charAt(88);
                var head = text.charAt(87);
                var pause = text.charAt(84);
                // check each flag that prevents printing
                if (is_error == '0') {
                    ok = true;
                    statuses.push("Ready to Print");
                }
                if (media == '1')
                    statuses.push("Paper out");
                if (media == '2')
                    statuses.push("Ribbon Out");
                if (media == '4')
                    statuses.push("Media Door Open");
                if (media == '8')
                    statuses.push("Cutter Fault");
                if (head == '1')
                    statuses.push("Printhead Overheating");
                if (head == '2')
                    statuses.push("Motor Overheating");
                if (head == '4')
                    statuses.push("Printhead Fault");
                if (head == '8')
                    statuses.push("Incorrect Printhead");
                if (pause == '1')
                    statuses.push("Printer Paused");
                if ((!ok) && (statuses.Count == 0))
                    statuses.push("Error: Unknown Error");
                finishedFunction(statuses.join());
            }, printerError);
    }

    function printComplete() {
        //alert('Print Complete Function firing');
        jslog("Zebra bar code printing complete.");
    }

    function printerError(text) {

        alert("An error occurred while printing on Zebra printer. Please check if Zebra printer is online and try again." + text);
    }

}
