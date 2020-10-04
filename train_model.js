// npm install @tensorflow/tfjs --save
// npm install @tensorflow/tfjs-node-gpu

const fs = require('fs');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node-gpu');


const test_data_path = "./tokenized/test";
const train_data_path = "./tokenized/train";
const dictionary_filepath = "./dictionaries/dictionary.json";
const model_name = "my_model";

const sample_length = 100;
const load_model = false;
const batch_size = 32;
const epochs = 5;

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

	// 1) Load data
	// Load Train data
	let X_train_raw = fs.readFileSync(train_data_path + "/X_data.json");
	X_train = JSON.parse(X_train_raw);
	let y_train_raw = fs.readFileSync(train_data_path + "/y_data.json");
	y_train = JSON.parse(y_train_raw);

	// Load test data
	let X_test_raw = fs.readFileSync(test_data_path + "/X_data.json");
	X_test = JSON.parse(X_test_raw);
	let y_test_raw = fs.readFileSync(test_data_path + "/y_data.json");
	y_test = JSON.parse(y_test_raw);

	// 2) Get some additional values we need for making a model
	// Load dictionary
	let dictionary_raw = fs.readFileSync(dictionary_filepath);
	dictionary = JSON.parse(dictionary_raw);

	const number_of_words = Math.max.apply(null, Object.values(dictionary))+1;
	const number_of_tags = Math.max.apply(null, y_train)+1;

	// 3) fix the length off all the data
	X_train = fix_length(X_train, sample_length);
	X_test = fix_length(X_test, sample_length);
	X_train = tf.tensor2d(X_train, [X_train.length, sample_length], 'int32');
	X_test = tf.tensor2d(X_test, [X_test.length, sample_length], 'int32');

	// // Optional) Count all tokens
	// var class_weight = {};
	// for (let value of y_train){
	// 	if (value in class_weight){
	// 		class_weight[value] += 1;
	// 	} else {
	// 		class_weight[value] = 1;
	// 	}
	// }
	// console.log(class_weight)

	// 4) onehot encode y data
	y_train = tf.oneHot(tf.tensor1d(y_train, 'int32'), number_of_tags);
	y_test = tf.oneHot(tf.tensor1d(y_test, 'int32'), number_of_tags);

	console.log("y train data");
	console.log(y_train);
	console.log("X train data");
	console.log(X_train);

	// 5) Make model
	if (load_model == false){

		var input = tf.input({shape: [sample_length]});
		layers = tf.layers.embedding({
			inputDim: number_of_words, outputDim: 12, inputLength:sample_length}).apply(input);
		layers = tf.layers.conv1d({filters: 8, kernelSize: 2, strides: 1}).apply(layers);
		layers = tf.layers.conv1d({filters: 8, kernelSize: 2, strides: 1}).apply(layers);

		layers = tf.layers.globalMaxPooling1d().apply(layers);
		
		layers = tf.layers.dense({units: 64, activation: 'relu'}).apply(layers);
		// layers = tf.layers.dropout(0.4).apply(layers);
		layers = tf.layers.dense({units: number_of_tags, activation: 'softmax'}).apply(layers);
		model = tf.model({inputs: input, outputs: layers});
	} 

	// 8) Load model
	else {
		model = await tf.loadLayersModel('file://./models/' + model_name + '/model.json');
	}

	// Compile
	model.compile({optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy']});

	// 6) Train model
	const history = await model.fit(X_train, y_train, {
	  epochs: epochs,
	  batchSize: batch_size,
	  validationData: [X_test, y_test],
		// classWeight: class_weight,
	  callbacks: {
	    onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`)
	  }
	});

	// 7) Save model
	const saveResults = await model.save('file://./models/' + model_name);
}

main();