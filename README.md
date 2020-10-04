# Predict tags for text in Java Script

This github shows an example how you can train a NLP Deep Learning model using TensorFlow JS in NodeJS and deploy it on both the backend as frontend.

## Installation

You need NodeJS to run the code.
Install all the packages.

```bash
npm install
```

## Usage

First download your train and test data.
Give it a propper folder structure:
- ./datasets/yourdataset/train/label0
- ./datasets/yourdataset/train/label1
- ./datasets/yourdataset/train/label2
- ./datasets/yourdataset/test/label0
- ./datasets/yourdataset/test/label1
- ./datasets/yourdataset/test/label2

You have to adjust the hard code folder paths. I know that this is sloppy but I can't be bothered to make it proper right now.

Create a dictionary from your datasets
```bash
node create_dictionary.js
```

Tokenize your datasets
```bash
node tokenize_text.js
```

Train your model
```bash
node train_model.js
```

Use your model in the backend
```bash
node use_model.js
```

Use your model in the frontend
```bash
node server.js
```
And go to localhost:3000/index.html

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.
