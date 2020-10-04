const fs = require('fs');
const path = require('path');

const dictionary_filepath = "./dictionaries/dictionary.json";
const save_directory = "./tokenized";
const file_directory = "datasets/imdb";
const labels_dictionary_path = "./dictionaries";


function getSampleData(data, subfolder_names){

	filepath_list = [];
	labels = [];
	subfolders = [];

	// Split row to get reference for each sample
	const rows = data.split("\n");
	// console.log(rows);

	// Get the folders and labels of sample
	for (let row of rows){
		let row_split = row.split("/");
		let subfolder = row_split[0];
		let filename_label = row_split[1];
		if (subfolder){
			filename_label_split = filename_label.split(" ");
			filepath = filename_label_split[0];
			label = filename_label_split[1];
			filepath_list.push(filepath);
			labels.push(label);
			subfolders.push(subfolder);
		}
	}
	// console.log(filepath_list);
	return [subfolders, filepath_list, labels];
}

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

function tokenize(text, dictonary){
	tokenized_words = [];
	const words = text.split(" ");
	for (let word of words){
		token = dictonary[word];
		if (!token){
			// Missing word
			token = 1;
		}
		tokenized_words.push(token);
	}
	return tokenized_words
}

// 0) Get the file names and labels
const load_folder = "./datasets/imdb";
const subfolder_names = ["test","train"];
const label_names = ["neg","pos"];

filename_list = [];
subfolders = [];
labels = [];

subfolder_names.forEach(function(subfolder_name) {
	label_names.forEach(function(label_name){
	  let files = fs.readdirSync(path.join(__dirname, load_folder, subfolder_name, label_name));
	  files.forEach(function (file) {
	      // Do whatever you want to do with the file
	      filename_list.push(path.join(label_name, file));
	      subfolders.push(subfolder_name);
	      labels.push(label_name);
	  });
	})
});

// console.log(subfolders);
// console.log(filename_list);
// console.log(labels);

// 1) Load dictionary
let dictionary_raw = fs.readFileSync(dictionary_filepath);
dictionary = JSON.parse(dictionary_raw);

// 2) Tokenize text
tokens_list = [];
for (let index = 0; index < subfolders.length; index++){
	let subfolder = subfolders[index];
	let filename = filename_list[index];
	// Load text
	let text = fs.readFileSync(file_directory + "/" + subfolder + "/" + filename, 'utf8');
	// Clean text
	text = cleanText(text);
	// Tokenize
	tokens = tokenize(text, dictionary);
	tokens_list.push(tokens);
}

// 3) Index labels
let unique_labels = labels.filter((item, i, ar) => ar.indexOf(item) === i);
label_indices = labels.map(label => unique_labels.indexOf(label));

// 4) Restructure the data in the form we want for training
sorted_tokens = {};
sorted_indices = {};
for (let index = 0; index < subfolders.length; index++){
	let subfolder = subfolders[index];
	let indices = label_indices[index];
	let tokens = tokens_list[index];
	// Create subfolder if it does not exist
	if (!(subfolder in sorted_tokens)){
		sorted_tokens[subfolder]=[];
		sorted_indices[subfolder]=[];
	}
	sorted_tokens[subfolder].push(tokens);
	sorted_indices[subfolder].push(indices);
}

// 5) Save data
if (!fs.existsSync(save_directory)){
  fs.mkdirSync(save_directory);
}
for (let key in sorted_tokens){
  // Create directory string
	let directory = save_directory + "/" + key;
	// Create foler
	if (!fs.existsSync(directory)){
    fs.mkdirSync(directory);
	}
	// Save tokens
	var json_tokens = JSON.stringify(sorted_tokens[key]);
	fs.writeFile(directory + "/X_data.json", json_tokens, 'utf8', function (err) {
	  if (err) {
	      console.log("An error occured while writing JSON Object to File.");
	      return console.log(err);
	  }
	});
	// Save label indices
	var json_indices = JSON.stringify(sorted_indices[key]);
	fs.writeFile(directory + "/y_data.json", json_indices, 'utf8', function (err) {
	  if (err) {
	      console.log("An error occured while writing JSON Object to File.");
	      return console.log(err);
	  }
	});
}

// 6) Save labels dictionary
var inverse_labels_dict = {};
for (let label_index in unique_labels){
	let label = unique_labels[label_index];
  inverse_labels_dict[label_index] = label;
}
var json_inverse_labels_dict = JSON.stringify(inverse_labels_dict, null, 4);
fs.writeFile(labels_dictionary_path + "/inverse_labels_dictionary.json", json_inverse_labels_dict, 'utf8', function (err) {
  if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
  }
});

