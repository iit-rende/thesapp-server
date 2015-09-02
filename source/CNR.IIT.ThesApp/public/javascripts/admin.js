$(function () {
    var viewModel = function () {
        var self = this;
        self.domains = ko.observableArray([]);
        self.languages = ko.observableArray([]);
        self.messages = ko.observableArray([]);
        self.selectedDomain = ko.observable(null);
        self.selectedDomainLocalization = function (lang) {
            var defaultLocalization = { descriptor: '', description: '' };
            if (!self.selectedDomain()) return defaultLocalization;
            var loc = self.selectedDomain().localizations.filter(function (l) { return l.language == lang; });
            if (loc.length == 0) return defaultLocalization;
            return loc[0];
        };
        
        self.updateSelectedDomain = function (domain) {
            
           
            if (domain) {
                for (var i = 0; i < domain.localizations.length; i++) {
                    var loc = domain.localizations[i];
                    console.log(loc);
                    domain[loc.language] = domain.localizations[i];
                }
            }
            self.selectedDomain(domain);
            
        };

        self.importThesaurus = function (domain) {
            self.updateSelectedDomain(domain);
            $("#importModal").modal("show");
        };
        
        self.newDomain = function () {
            self.updateSelectedDomain(null);
            $("#domainModal").modal("show");
        };
               
        self.editDomain = function (domain) {
            self.updateSelectedDomain(domain);
            $("#domainModal").modal("show");
        };

        self.loadDomains = function () {
            return $.get("/domains?r=" + Math.random()).then(function (data) {
                data.domains.sort(function (a, b) { return a.descriptor > b.descriptor });
                self.domains(data.domains);
            });
        };

        self.loadLanguages = function () {
            return $.get("/languages").then(function (data) {
                self.languages(data.languages);
            });
        };

        self.loadMessages = function () {
            return $.get("/admin/messages?r=" + Math.random()).then(function (data) {
                self.messages(data.messages);
            });
        };
        
        self.askConfirmationForDomainRemoval = function (domain) {
            self.updateSelectedDomain(domain);
            $("#removeDomainModal").modal("show");
        };

        self.removeDomain = function () {
            $.ajax({
                url: '/admin/domains?descriptor=' + encodeURIComponent(self.selectedDomain().descriptor),
                method: "DELETE",
                success: function () {
                    $("#removeDomainModal").modal("hide");
                    setTimeout(self.loadDomains, 1000);
                }
            });
            
        };
    };
    
    var vm = new viewModel();
    ko.applyBindings(vm);
    
    vm.loadDomains();
    vm.loadLanguages();
    vm.loadMessages();
    
    $(".alert").fadeTo(4000, 500).slideUp(500, function () {
        $(".alert").alert('close');
    });

    $('#searchTab').bind('show.bs.tab', function (e) {
        setTimeout(function () { drawCharts(); }, 200);
        
    });

    $("#newmessage").bind('submit', function (evt) {
        var form = $(this);
        $.ajax({
            url: form.attr("action"),
            method: form.attr("method"),
            data: form.serialize(),
            success: function (){
                
                $("#messageModal").modal("show");
                form[0].reset();

                vm.loadMessages().then(function () {
                    $("#pastmessages tbody tr").eq(0).find("td").addClass("selected");
                });
            }
        });
        evt.preventDefault();
        return false; 
    });

    $("#editdomain").bind('submit', function (evt) {
        var form = $(this);
        var data = form.serialize();
        $.ajax({
            url: form.attr("action"),
            method: $("input[name=existingDescriptor]").val() ? "PUT" : "POST",
            data: data,
            success: function () {
                $("#domainModal").modal("hide");
                form[0].reset();
                setTimeout(vm.loadDomains, 1000);
            }
        });
        evt.preventDefault();
        return false;
    });


});

function drawCharts(){
    drawChart1();
    drawChart2();
    drawChart3();
    drawChart4();
}

// draws it.
function drawChart1() {
    
    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Language');
    data.addColumn('number', 'Count');
    data.addRows([
        ['it', 320],
        ['en', 84]
    ]);
    
    // Set chart options
    var options = {
        'title': 'By language',
        'height': 300,
        'chartArea': { left: '5%', top: '10%', width: "90%", height: "100%" }
    };
    
    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.PieChart(document.getElementById('languagesChart'));
    chart.draw(data, options);
}
function drawChart2() {
    
    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Domain');
    data.addColumn('number', 'Count');
    data.addRows([
        ['Turismo', 54],
        ['Malattie rare', 50]
    ]);
    
    // Set chart options
    var options = {
        'title': 'By domain',
        'height': 300,
        'chartArea': { left: '5%', top: '10%', width: "90%", height: "100%" }
    };
    
    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.PieChart(document.getElementById('domainsChart'));
    chart.draw(data, options);
}
function drawChart3() {
    
    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Type');
    data.addColumn('number', 'Count');
    data.addRows([
        ['Syntactic', 140],
        ['Semantic', 90]
    ]);
    
    // Set chart options
    var options = {
        'title': 'By type',
        'height': 300,
        'chartArea': { left: '5%', top: '10%', width: "90%", height: "100%" }
    };
    
    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.PieChart(document.getElementById('searchesChart'));
    chart.draw(data, options);
}
function drawChart4() {
    
    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'X');
    data.addColumn('number', 'Terms opened');
    data.addRows([
        ['1/5', 210],
        ['2/5', 220],
        ['3/5', 200],
        ['4/5', 195],
        ['5/5', 245],
        ['6/5', 265],
        ['7/5', 275],
        ['8/5', 250],
        ['9/5', 280],
        ['10/5', 240],
        ['11/5', 300],
        ['12/5', 290],
        ['13/5', 305],
        ['14/5', 310],
        ['15/5', 300],
        ['16/5', 310],
        ['17/5', 230],
        ['18/5', 320],
        ['19/5', 360],
        ['20/5', 330],
        ['21/5', 350],
        ['22/5', 370],
        ['23/5', 310],
        ['24/5', 325],
        ['25/5', 335],
        ['26/5', 380]
    ]);
    
    // Set chart options
    var options = {
        'title': 'This month\'s hits',
        'height': 300,
        'chartArea': { left: '5%', top: '10%', width: "90%", height: "70%" },
        'legend': { position: 'bottom' }
    };
    
    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.LineChart(document.getElementById('weekChart'));
    chart.draw(data, options);
}

google.load('visualization', '1', { 'packages': ['corechart'] });
//google.setOnLoadCallback(drawCharts);