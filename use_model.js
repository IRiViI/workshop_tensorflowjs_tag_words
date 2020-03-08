const fs = require('fs');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node-gpu');

const dictionary_filepath = "./dictionaries/dictionary.json";
const labels_filepath = "./dictionaries/inverse_labels_dictionary.json";
const model_name = "my_model";

const sample_length = 100;

const prediction_cutoff = 0.1;

// 0) Determine a text sample
// const sample_text = "I love tea a lot. I Like green tea, black tea, all tea!";
const sample_text = "Coffee coffee coffee";
// const sample_text = "steal iron and more iron";
// const sample_text = "tin tin tin"
// const sample_text = `INDONESIA SEES CPO PRICE RISING SHARPLY
//   Indonesia expects crude palm oil (CPO)
//   prices to rise sharply to between 450 and 550 dlrs a tonne FOB
//   sometime this year because of better European demand and a fall
//   in Malaysian output, Hasrul Harahap, junior minister for tree
//   crops, told Indonesian reporters.
//       Prices of Malaysian and Sumatran CPO are now around 332
//   dlrs a tonne CIF for delivery in Rotterdam, traders said.
//       Harahap said Indonesia would maintain its exports, despite
//   making recent palm oil purchases from Malaysia, so that it
//   could possibly increase its international market share.
//       Indonesia, the world's second largest producer of palm oil
//   after Malaysia, has been forced to import palm oil to ensure
//   supplies during the Moslem fasting month of Ramadan.
//       Harahap said it was better to import to cover a temporary
//   shortage than to lose export markets.
//       Indonesian exports of CPO in calendar 1986 were 530,500
//   tonnes, against 468,500 in 1985, according to central bank
//   figures.
//   `


function cleanText(text){
  text = text.toLowerCase();
  text = text.replace(/\s\s+/g, ' ');

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
  var text = cleanText(sample_text);
  // console.log(text);

  // 4) Tokenize the text
  var tokens = tokenize(text, dictionary);
  console.log(tokens);
  
  // 5) Create X data format
	var X_data = fix_length([tokens], sample_length);
	X_data = tf.tensor2d(X_data, [X_data.length, sample_length], 'int32');
	// X_data.print();

	// 6) Make a prediction
	var y_prediction = model.predict(X_data);
	// y_prediction.print();

	// 7) Filter for predictions about some percentage
	y_prediction = y_prediction.dataSync(); 
	y_filtered_prediction = y_prediction.map(function(value) { return value > prediction_cutoff ? value : 0; });
	// console.log(y_prediction);
	
	// 8) Get the predictions
	var predictions = [];
  for (let index = 0; index < y_filtered_prediction.length; index++){
  	prediction_value = y_filtered_prediction[index];
  	if (prediction_value > 0){
	  	prediction_label = labels[index];
	  	console.log(prediction_label, prediction_value);
  	}
  }
}

main();