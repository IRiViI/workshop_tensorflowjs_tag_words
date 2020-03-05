const fs = require('fs');

function cleanText(text){
  text = text.toLowerCase();

  // Replace special symbols by separable symbols
  text = text.replace(/(\r\n|\n|\r)/gm, " ");
  text = text.replace(/\'/g, '');
  text = text.replace(/\./g, " . ");
  text = text.replace(/,/g, " , ");
  text = text.replace(/\?/g, " ? ");
  text = text.replace(/!/g, " ! ");
  text = text.replace(/;/g, " ; ");
  text = text.replace(/\“/g, ' " ');
  text = text.replace(/\”/g, ' " ');
  text = text.replace(/\—/g, ' ');
  text = text.replace(/\-/g, ' ');
  text = text.replace(/\&/g, ' & ');
  text = text.replace(/_/g, '');
  text = text.replace(/:/g, ' : ');
  text = text.replace(/\(/g, ' ( ');
  text = text.replace(/\)/g, ' ) ');
  text = text.replace(/\//g, ' / ');
  text = text.replace(/\\/g, ' \ ');
  text = text.replace(/\+/g, ' + ');
  text = text.replace(/\-/g, ' - ');
  text = text.replace(/\>/g, ' ');
  text = text.replace(/"/g, '');
  text = text.replace(/‘/g, '');

  return text;
}

function countWords(text, word_counts){

  // 2) Clean text
  text = cleanText(text);
  // console.log(text);

  // Split the text and remove spaces
  // 0)
  words = text.split(" ");
  words = words.filter(word => word != ''	);
  // console.log(words.splice(0,100));

  // Count words
  // 1)
  for (let word of words){
  	if (word in word_counts){
  		word_counts[word]++;
  	} else {
  		word_counts[word]=1;
  	}
  }
  return word_counts;
}

function createFilepathList(data, subfolder_names){

	filepath_list = [];

	// Split row to get reference for each sample
	const rows = data.split("\n");
	// console.log(rows);

	// Get the folders and labels of sample
	for (let row of rows){
		let row_split = row.split("/");
		let subfolder = row_split[0];
		let filename_label = row_split[1];
		if (subfolder_names.includes(subfolder)){
			filepath = row.split(" ")[0];
			filepath_list.push(filepath);
		}
	}
	// console.log(filepath_list);

	return filepath_list;
}

// 0) Read file
// const filename = "1";
// load_folder = "./datasets/reuters/training";
// fs.readFile(load_folder + "/" + filename, 'utf8', function(err, data) {
//   if (err) throw err;
// 	console.log(data);
// })

// 1) Count words for one file
// const filename = "1";
// load_folder = "./datasets/reuters/training";
// fs.readFile(load_folder + "/" + filename, 'utf8', function(err, data) {
//   if (err) throw err;
//   let word_counts = {};
// 	console.log(countWords(data, word_counts));
// })

// Count words for all the words according to cats file
const load_folder = "./datasets/reuters";
const subfolder_names = ["training"];
const cats_filepath = "./datasets/reuters/cats.txt";
const minimal_occurance = 3;
const save_folder = "./dictionaries";

// 2) Get a list with all the files
var data = fs.readFileSync(cats_filepath, 'utf8');
var filename_list = createFilepathList(data, subfolder_names);

// 3) Count every word of every sample
var word_counts = {};
// console.log(filename_list)
for (let filename of filename_list){
	var data = fs.readFileSync(load_folder + "/" + filename, 'utf8');
  word_counts = countWords(data, word_counts);
}
// console.log(word_counts);

// 5) Shrink wordsCounter
var words_counter_list = [];
for (let wordkey in word_counts) {
	let value = word_counts[wordkey];
	if (value >= minimal_occurance){
    words_counter_list.push([wordkey, value]);
	}
}
// console.log(words_counter_list);

// 6) Sort the list
words_counter_list.sort(function(a, b) {
    return b[1] - a[1];
});
// console.log(words_counter_list);

// Optional) Use the "stopwords" to reduce the list

// 7) Make Dictonaries
dictonary = {}
inverse_dictonary= {}
for (let i = 0; i < words_counter_list.length; i++){
	word = words_counter_list[i][0];
  // 0 is reserved for spaces
  // 1 is reserved for unkown words
	dictonary[word]=i+2;
	inverse_dictonary[i+2]=word;
}
// console.log(dictonary);
// console.log(inverse_dictonary);

// 8 Save Everything)
var json_dictonary = JSON.stringify(dictonary);
fs.writeFile(save_folder + "/" + "dictionary.json", json_dictonary, 'utf8', function (err) {
  if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
  }
});

var json_inverse_dictonary = JSON.stringify(inverse_dictonary);
fs.writeFile(save_folder + "/" + "inverse_dictionary.json", json_inverse_dictonary, 'utf8', function (err) {
  if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
  }
});