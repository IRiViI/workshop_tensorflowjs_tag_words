// npm install @tensorflow/tfjs --save
// npm install @tensorflow/tfjs-node-gpu

const fs = require('fs');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node-gpu');


const test_data_path = "./tokenized/test";
const train_data_path = "./tokenized/training";
const dictionary_filepath = "./dictionaries/dictionary.json";
const model_name = "my_model"

const sample_length = 400;
const load_model = true;
const batch_size = 32;
const epochs = 10;

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

	// 2) Get some additional values Load dictionary
	let dictionary_raw = fs.readFileSync(dictionary_filepath);
	dictionary = JSON.parse(dictionary_raw);

	const number_of_words = Math.max.apply(null, Object.values(dictionary));
	const number_of_tags = Math.max.apply(null, y_train);

	// 3) fix the length off all the data
	X_train = fix_length(X_train, sample_length);
	X_test = fix_length(X_test, sample_length);
	X_train = tf.tensor2d(X_train, [X_train.length, sample_length], 'int32');
	X_test = tf.tensor2d(X_test, [X_test.length, sample_length], 'int32');

	// 4) onehot encode y data
	y_train = tf.oneHot(tf.tensor1d(y_train, 'int32'), number_of_tags);
	y_test = tf.oneHot(tf.tensor1d(y_test, 'int32'), number_of_tags);

	console.log("y train data");
	console.log(y_train);
	console.log("X train data");
	console.log(X_train);

	// 5) Make model
	if (load_model == false){
	  var model = tf.sequential();
	  model.add(tf.layers.embedding({inputDim: number_of_words, outputDim: 16, inputLength:sample_length}));
		model.add(tf.layers.conv1d({filters: 16, kernelSize: 2, strides: 1}));
		model.add(tf.layers.globalAveragePooling1d());
		// model.add(tf.layers.globalMaxPooling1d());
		model.add(tf.layers.dense({units: 256, activation: 'relu'}));
	  model.add(tf.layers.dropout(0.2));
		model.add(tf.layers.dense({units: number_of_tags, activation: 'softmax'}));
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
	  callbacks: {
	    onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`)
	  }
	});

	// 7) Save model
	const saveResults = await model.save('file://./models/' + model_name);
}

main();