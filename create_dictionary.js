const fs = require('fs');
const path = require('path');

// https://ai.stanford.edu/~amaas/data/sentiment/

function cleanText(text){
  text = text.toLowerCase();
  text = text.replace(/\s\s+/g, ' ');

  // Replace special symbols by separable symbols
  text = text.replace(/(\r\n|\n|\r)/gm, " ");
  // text = text.replace(/\'/g, '');
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
  // text = text.replace(/‘/g, '');

  return text;
}

function countWords(text, word_counts){

  // 2) Clean text
  text = cleanText(text);

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

// Count words for all the words
const load_folder = "./datasets/imdb/train";
const subfolder_names = ["neg","pos"];
const minimal_occurance = 100;
const save_folder = "./dictionaries";

// 0) Get a list with all the files
filename_list = [];
subfolder_names.forEach(function(subfolder_name) {
  let files = fs.readdirSync(path.join(__dirname, load_folder, subfolder_name));
  files.forEach(function (file) {
      // Do whatever you want to do with the file
      filename_list.push(path.join(subfolder_name, file))
  });
});
// console.log(filename_list);

// 1) Count every word of every sample
var word_counts = {};
// console.log(filename_list)
for (let filename of filename_list){
	var data = fs.readFileSync(load_folder + "/" + filename, 'utf8');
  word_counts = countWords(data, word_counts);
}
// console.log(word_counts);

// 2) Only keep words which occure enough times
var words_counter_list = [];
for (let wordkey in word_counts) {
	let value = word_counts[wordkey];
	if (value >= minimal_occurance){
    words_counter_list.push([wordkey, value]);
	}
}
// console.log(words_counter_list);

// 3) Sort the list
words_counter_list.sort(function(a, b) {
    return b[1] - a[1];
});
// console.log(words_counter_list);

// Optional) Use the "stopwords" to reduce the list

// 4) Make Dictonaries
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

// 5) Save Everything
var json_dictonary = JSON.stringify(dictonary, null, 4);
fs.writeFile(save_folder + "/" + "dictionary.json", json_dictonary, 'utf8', function (err) {
  if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
  }
});

var json_inverse_dictonary = JSON.stringify(inverse_dictonary, null, 4);
fs.writeFile(save_folder + "/" + "inverse_dictionary.json", json_inverse_dictonary, 'utf8', function (err) {
  if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
  }
});