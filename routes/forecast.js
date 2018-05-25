var express = require('express')
var router = express.Router()
var axios = require('axios')
var moment = require('moment')

// In production I would put this in an enviornment variable. Probably start the app with pm2 or something like that
const API_KEY = process.env.WEATHER_API_KEY || 'dc94b5caf61ef2f2073c868bd7d130d9';

// NOTE: This is just for testing purposes
process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

function validateZipCode(zipcode) {
  return /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zipcode)
}

/* GET users listing. */
router.get('/fivedays/:zipcode', function(req, res, next) {
  if (!validateZipCode(req.params.zipcode)) {
    
    res.status(400).send({status: 400, errors: [{message: 'Invalid zipcode'}]})
    return;
  }
  // Since i am validateing the input I don't have to worry about any injection type hack here
  axios.get(`http:\/\/api.openweathermap.org\/data\/2.5\/forecast?zip=${req.params.zipcode},us&APPID=${API_KEY}&units=imperial`)
    .then(({data}) => {
      let ret = []
      for (let o of data.list) {
        let date = new Date()
        date.setTime(o.dt*1000)
        let item = {
          dt: moment(date).format('ddd MMM YYYY DD HH:mm:ss'),
          temp_min: o.main.temp_min,
          temp_max: o.main.temp_max
        }
        ret.push(item)
      }
      res.send(ret)
    }).catch( (e) => {
      console.error(e)
      res.status(401).send({status: 401, errors: [{message: 'Error processing weather data'}]})
    })
})

router.get('/fivedays_challenge1/:zipcode', function(req, res, next) {
  if (!validateZipCode(req.params.zipcode)) {
    res.status(400).send({status: 400, errors: [{message: 'Invalid zipcode'}]})
    return;
  }
  // Since i am validateing the input I don't have to worry about any injection type hack here
  axios.get(`http:\/\/api.openweathermap.org\/data\/2.5\/forecast?zip=${req.params.zipcode},us&APPID=${API_KEY}&units=imperial`)
    .then(({data}) => {
      let ret = []
      for (let o of data.list) {
        let date = new Date()
        date.setTime(o.dt*1000)
        let item = {
          dt: moment(date),
          temp_min: o.main.temp_min,
          temp_max: o.main.temp_max
        }
        if (ret.length===0 || ret[ret.length-1].dt.dayOfYear()!==item.dt.dayOfYear()) {
          ret.push(item)
        }
      }
      ret.map((o) => {
        o.dt = o.dt.format('ddd MMM YYYY DD HH:mm:ss')
        return o
      })
      res.send(ret)
    }).catch( (e) => {
      console.error(e)
      res.status(401).send({status: 401, errors: [{message: 'Error processing weather data'}]})
    })
})

router.get('/fivedays_challenge2/:zipcode', function(req, res, next) {
  if (!validateZipCode(req.params.zipcode)) {
    res.status(400).send({status: 400, errors: [{message: 'Invalid zipcode'}]})
    return;
  }
  // Since i am validateing the input I don't have to worry about any injection type hack here
  axios.get(`http:\/\/api.openweathermap.org\/data\/2.5\/forecast?zip=${req.params.zipcode},us&APPID=${API_KEY}&units=imperial`)
    .then(({data}) => {
      let ret = []
      for (let o of data.list) {
        let date = new Date()
        date.setTime(o.dt*1000)
        let item = {
          dt: moment(date),
          temp_count: 1,
          temp_min: o.main.temp_min,
          temp_max: o.main.temp_max
        }
        if (ret.length===0 || ret[ret.length-1].dt.dayOfYear()!==item.dt.dayOfYear()) {
          ret.push(item)
        } else {
          ret[ret.length-1].temp_min += item.temp_min
          ret[ret.length-1].temp_max += item.temp_max
          ret[ret.length-1].temp_count++
        }
      }
      ret.map((o) => {
        o.dt = o.dt.format('ddd MMM YYYY DD HH:mm:ss')
        o.temp_min = o.temp_min / o.temp_count
        o.temp_max = o.temp_max / o.temp_count
        delete o.temp_count
        return o
      })
      res.send(ret)
    }).catch( (e) => {
      console.error(e)
      res.status(401).send({status: 401, errors: [{message: 'Error processing weather data'}]})
    })
})

module.exports = router
