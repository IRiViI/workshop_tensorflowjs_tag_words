const fs = require('fs');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node-gpu');

const dictionary_filepath = "./dictionaries/dictionary.json";
const labels_filepath = "./dictionaries/inverse_labels_dictionary.json";
const model_name = "my_model";

const sample_length = 100;


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
	var words = text.split(" ");
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

function fix_length(data, fix_length){
	reshaped_data = []
	for (let sample of data){
		// console.log(sample.length);
		// Shorten
		if (sample.length > fix_length){
			sample = sample.splice(0,fix_length);
		} else {
			while (sample.length < fix_length){
				// Add space post data
				sample.push(0);
			}
		}
		// console.log(sample.length);
		reshaped_data.push(sample);
	}
	return reshaped_data;
}

// 0) Determine a text sample
const sample_texts = [
	"I love tea a lot. I Like green tea, black tea, all tea!",
	"I hate tea. I don't like green tea, black tea, all tea!",
  "I hate tea a lot. I don't like green tea, black tea, all tea!",
  "I see a cat",
  "Do you love me?",
  "I don't love you",
  "I don't like it",
  "I don't like it"
];
// const sample_text = ;

async function main(){

  // 1) Load model
  model = await tf.loadLayersModel('file://./models/' + model_name + '/model.json');

	// 2) Load dictionary
	let dictionary_raw = fs.readFileSync(dictionary_filepath);
	dictionary = JSON.parse(dictionary_raw);

	var number_of_words = Math.max.apply(null, Object.values(dictionary));

  // Labels
	let labels_raw = fs.readFileSync(labels_filepath);
	labels = JSON.parse(labels_raw);

  // 3) Clean the text
  // var text = cleanText(sample_text);
  var texts = sample_texts.map(sample_text => cleanText(sample_text))
  // console.log(text);

  // 4) Tokenize the text
  // var tokens = [tokenize(text, dictionary)];
  var tokens = texts.map(text => tokenize(text, dictionary));
  // console.log(tokens);
  
  // 5) Create X data format
	var X_data = fix_length(tokens, sample_length);
	X_data = tf.tensor2d(X_data, [X_data.length, sample_length], 'int32');
	// X_data.print();

	// 6) Make a prediction
	var y_prediction = model.predict(X_data);
	y_prediction = y_prediction.dataSync(); 
	// console.log(y_prediction);
	
	// 7) Display the predictions
	var predictions = [];
	for (index=0; index<y_prediction.length/2; index+=1){
		prediction_value = y_prediction[2*index];
		let sample_text = sample_texts[index]
		console.log(sample_text);
		if (prediction_value<0.5){
			console.log("positive", 1-prediction_value);
		} else {
			console.log("negative", prediction_value);
		}
	}
  // for (let index = 0; index < y_filtered_prediction.length; index++){
  // 	prediction_value = y_filtered_prediction[index];
  // 	if (prediction_value > 0){
	 //  	prediction_label = labels[index];
	 //  	console.log(prediction_label, prediction_value);
  // 	}
  // }
}

main();