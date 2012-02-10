define(['./z',
        './views/accountListView',
        './views/loginView',
        './views/transactionView',
        './views/cardView',
        './views/cardChooser'
        ],
    function(z){

        var app = z.app({ width: 640, height: 920 });


        if(document.location.search.indexOf('static')==-1)
            app.init(document.getElementById('z-app'));

        /*
        if(document.location.search.indexOf('view')!=-1){
            document.getElementById('z-app').style.top = 
        }*/

        app.server = {
            login: function(ssn, password, cb){
                return cb({success: true});
                $.ajax({ url: '/login' }).then(function(response){
                    cb(response);
                });
            }
        };
    }
);

