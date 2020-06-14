const express = require('express');
var ibmdb = require('ibm_db');
var connStr = "DATABASE=BLUDB;HOSTNAME=dashdb-txn-sbox-yp-dal09-11.services.dal.bluemix.net;UID=rzl86898;PWD=hfs82q+m31tv44k7;PORT=50000;PROTOCOL=TCPIP";


const router = express.Router();

var day = 0;
var temparature = 0;

// define routes

router.get('/main', (req, res) => {
    console.log("in view")
    ibmdb.open(connStr, function (err,conn) {
        if (err) return console.log(err);
        
        conn.query(`select MAX("DAY") as day, MAX("TEMP") as temp from TEMPDATA`, function (err, data) {
          if (err) console.log(err);
          else console.log(data[0].DAY);
                temparature = data[0].TEMP;
          conn.close(function () {
            console.log('done');
          });
          day = data[0].DAY + 1;
          res.render("form",{data: day})
        });
      });
});



router.post('/main', (req, res) => {
    console.log("submitted")

    temperature = req.body.temperature;
    ibmdb.open(connStr,function(err,conn){
        conn.prepare(`insert into TEMPDATA ("TEMP", "DAY") VALUES (?, ?)`,
        function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }
    
            //Bind and Execute the statment asynchronously
            stmt.execute([temperature, day], function (err, result) {
                if( err ) console.log(err);
                else result.closeSync();
    
                //Close the connection
                conn.close(function(err){});
            });
        });
    });
    res.redirect('/status')
    
});


router.get('/status', (req,res) => {
    ibmdb.open(connStr, function (err,conn) {
        if (err) return console.log(err);
        
        conn.query('select AVG(TEMP) as meantemp from TEMPDATA', function (err, data) {
          if (err) console.log(err);
          else console.log(data);
      
          conn.close(function () {
            console.log('done');
          });
          if(data[0].MEANTEMP > temparature) {
              var status = "Its safe"
          } else {
              var status = "Abnormality detected"
          }
          res.render("status", {status: status})
        });
      });
})





module.exports = router;