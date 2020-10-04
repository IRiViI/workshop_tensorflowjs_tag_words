
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

const source = "http://localhost:3000";

const dictionary_filepath = source + "/dictionaries/dictionary.json";
const labels_filepath = source + "/dictionaries/inverse_labels_dictionary.json";
const model_name = "my_model";

const sample_length = 100;
var number_of_words = 0;

var model = undefined;
var dictionary = {};
var labels = {};

function load(){

	async function load_model(){
		model = await tf.loadLayersModel(source + '/models/' + model_name + '/model.json');
	}

  // 1) Load model
  load_model();

	// 2) Load dictionary
  getJSON(dictionary_filepath, (err, data)=>{ 
		dictionary = data;
		number_of_words = Math.max.apply(null, Object.values(dictionary));
	})
	getJSON(labels_filepath, (err, data)=>{ 
		labels = data;
	});
}

function getJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};

function predict_input(){
	// Predict value
	let value = document.getElementById("input-value").value;
	let myPrediction = 1-predict(value);
	// Emote list
	let emoteList = ["fa-grin-beam", "fa-grin", "fa-smile", "fa-meh", "fa-frown-open", "fa-frown"];
	// Get emote element
	let emoteElement = document.getElementById("emote");
	// Remove current emote
	for (let classItem of emoteList){
		emoteElement.classList.remove(classItem);
	}
  // Add emote
  let index = undefined;
  if (myPrediction < 0.2){
  	index = 5;
  } else if (myPrediction < 0.4){
  	index = 4;
  } else if (myPrediction < 0.6){
  	index = 3;
  } else if (myPrediction < 0.8){
  	index = 2;
  } else if (myPrediction < 0.9){
  	index = 1;
  } else {
  	index = 0;
  }
  emoteElement.classList.add(emoteList[index])

}


function predict(sentence){

  // 3) Clean the text
  var text = cleanText(sentence);
  var texts = [text];
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
	
	return y_prediction[2*0];
}