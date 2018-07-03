//Ways of making the data dirty, mostly taken from Kim et al.'s "A Taxonomy of Dirty Data"'

//Assumes that "data" is an array of objects.

//I. Missing Data

  //Drop some rows

  var dropRow = function(data,x){
    //Drops the xth row from the data.
    //Without an x, drops a random row.
    let index = x ? x : ~~(Math.random() * data.length);
    data.splice(index,1);
    return data;
  }

  //Drop some columns
  var dropColumm = function(data,x){
    //Removes field "x" from all entries.
    //Without an x, removes a random key.
    let remove = x ? x : data[0].keys()[~~(Math.random() * data[0].keys().length)];
    data.forEach(function(d){
      delete d[remove];
    });
    return data;
  }

  //Drop some values in a row
  var dropPartialRow = function(data,x,y){

  }

  //Drop some values within a column
  var dropPartialColumn = function(data,x,y){

  }

//II. Wrong Data

//II.1. Integrity Failures - Ones that you can catch

  //Cast to wrong data type

  //Duplicate data

  //Corrupt data

//II.2 Integrity Failures pt 2 - Ones you might be able to catch

  //Wrong level of category

  //Superfluous/out of scope categorical values

  //Outdated temporal data


//II.3 Integrity Failures - Ones you'll never be able to catch

  //Data entry error

  //Misspelling

  //Extraneous data

  //Data in wrong field

  //Inconsistencies between data tables

//II.4 Unusable data

  //Different data for the same key in different tables

  //Use of abbreviations, aliases, or homonyms

  //Use of different encoding formats

  //Use of different units
