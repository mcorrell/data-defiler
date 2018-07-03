//Ways of making the data dirty, mostly taken from Kim et al.'s "A Taxonomy of Dirty Data"'


var drop = function(datum,field,MODE){
  //What to do with fields we get rid of.
  switch(MODE){
    case 'null':
    case 'n':
    default:
    datum[field] = null;
    break;

    case 'zero':
    case 'z':
    case '0':
    datum[field] = 0;
    break;

    case 'wildcard':
    case 'w':
    case '%':
    let modes = ['n','z','d'];
    datum = drop(datum,field,modes[~~(Math.random() * modes.length)]);
    break;

    case 'delete':
    case 'd':
      delete datum[field];
    break;
  }

  return datum;
}

//Assumes that "data" is an array of objects.

//I. Missing Data

  //Drop some rows
  var dropRow = function(data,x){
    //Drops the xth row from the data.
    //Without an x, drops a random row.
    let index = x || x==0 ? x  : ~~(Math.random() * data.length);
    data.splice(index,1);
    return data;
  }

  //Drop some columns
  var dropColumm = function(data,x,p,mode){
    //Removes field "x" from all entries.
    //Without an x, removes a random key.
    let k = Object.keys(data[0]);
    let remove = x ? x : k[~~(Math.random() * k.length)];
    data.forEach(function(d){
      d = drop(d,remove,"d");
    });
    return data;
  }

  //Drop some values in a row
  var dropPartialRow = function(data,x,y,mode){
    //Remove the last y fields from row x.
    //Without an x, remove the y fields from a random row.
    //Without a y, remove a random number of fields.
    let index = x || x==0 ? x : ~~(Math.random() * data.length);
    let k = Object.keys(data[index]);
    let toRemove = y ? Math.min(y,k.length) : ~~(Math.random() * k.length);

    for(let i = 1;i<= toRemove;i++){
      data[index] = drop(data[index],k[k.length - i],mode);
    }

    return data;
  }

  //Drop some values within a column
  var dropPartialColumn = function(data,x,y,mode){
    //Remove the field "y" from the last x rows.
    //If there's no y, choose a random field.
    //If there's no x, choose a random number of rows.
    let numRows = x ? x : ~~(Math.random() * data.length);
    let k = Object.keys(data[data.length - 1 - numRows]);
    let toRemove = y ? y : k[~~(Math.random() * k.length)];

    for(let i = data.length - 1 - numRows;i<data.length;i++){
      data[i] = drop(data[i],toRemove,mode);
    }
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
