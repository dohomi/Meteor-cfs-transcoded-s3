var AWS = Npm.require('aws-sdk');

/**
 *
 * @param {string} fileKey the cfs filekey
 * @return {string}
 */
var inputKey = function (fileKey) {
    return fileKey + "/source"
};
/**
 *
 * @param {string} fileKey
 * @param {string} presetId , the elastic transcoder presetId that for the transcoding
 * @return {string}
 */
var outputKey = function (fileKey, presetId) {
    return 'output_' + presetId;
};
/**
 * Creates the output prefix where the keyframe and the transcoded video
 * @param {string} fileKey
 * @return {string}
 */
var outputPrefix = function (fileKey) {
    return fileKey + "/output"
};
/**
 * @param {string} fileKey
 * @param {string} presetId
 * @return {string}
 */
var fullOutKey = function (fileKey, presetId) {
    return outputPrefix(fileKey) + "/" + outputKey(fileKey, presetId)
};
/**
 * returns the thumbnail pattern name
 * @param {string} presetId
 * @return {string}
 */
var thumbnailPattern = function (presetId) {
    return 'keyframe_{count}' + presetId;
};
/**
 *
 * @param {string}fileKey
 * @param options
 * @param {function():?} callback
 */
var scheduleTranscoding = function (fileKey, options, callback) {

    /**
     * @type {string}
     */
    var sourceKey = inputKey(fileKey);
    /**
     * @type {string}
     */
    var resultKeyPrefix = outputPrefix(fileKey);
    /**
     * @type {string}
     */
    var resultKey = outputKey(fileKey, options.presetId);
    /**
     * @type {string}
     */
    var resultThumbnailPattern = thumbnailPattern(options.presetId);

    /**
     * @type {AWS.ElasticTranscoder}
     */
    var elasticTranscoder = new AWS.ElasticTranscoder();
    /**
     *
     * @type {{PipelineId: string, Input: {Key: string, FrameRate: string, Resolution: string, AspectRatio: string, Interlaced: string, Container: string}, OutputKeyPrefix: string, Outputs: *[]}}
     */
    var params = {
        'PipelineId': options.pipelineId,
        'Input': {
            'Key': sourceKey,
            'FrameRate': 'auto',
            'Resolution': 'auto',
            'AspectRatio': 'auto',
            'Interlaced': 'auto',
            'Container': 'auto'

        },
        'OutputKeyPrefix': resultKeyPrefix,
        'Outputs': [
            {
                'Key': resultKey,
                'PresetId': presetId,
                'ThumbnailPattern': resultThumbnailPattern,
                'Rotate': 'auto'
            }
        ]
    };

    elasticTranscoder.createJob(params, callback);
};
/**
 *
 * @param {string} name
 * @param {{}} options
 * @return {FS.StorageAdapter}
 * @constructor
 */
FS.Store.TranscodedS3 = function (name, options) {

    var self = this;
    if (!(self instanceof FS.Store.TranscodedS3)) {
        throw new Error('FS.Store.TranscodedS3 missing keyword "new"');
    }

    options = options || {};

    if (!options.accessKeyId) {
        throw new Error("please provide a AWS accessKeyId");
    }
    if (!options.secretAccessKey) {
        throw new Error("please provide a AWS secretAccessKey");
    }
    if (!options.bucket) {
        throw new Error("please provide a S3 bucket");
    }
    if (!options.region) {
        throw new Error("please provide a AWS region");
    }
    if (!options.presetId) {
        throw new Error("please provide a Elastic Transcoder presetId");
    }
    if (!options.pipelineId) {
        throw new Error("please provide a Elastic Transcoder pipelineId");
    }

    
    var upload = Npm.require('s3-write-stream')({
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
        Bucket: options.bucket
    });
    return new FS.StorageAdapter(name, options, {
        typeName: 'storage.transcodedS3',
        fileKey: function (fileObj) {
            // Lookup the copy
            var store = fileObj && fileObj.copies && fileObj.copies[name];
            // If the store and key is found return the key
            if (store && store.key) return store.key;

            // If no store key found we resolve / generate a key
            return fileObj.collectionName + '/' + fileObj._id + '-' + fileObj.name;
        },
        createReadStream: function (fileKey, options) {

            /**
             *
             * @type {AWS.S3}
             */
            var s3 = new AWS.S3();
            /**
             * @type {string}
             */
            var key = fullOutKey(fileKey, presetId);

            /**
             *
             * @type {AWS.Request}
             */
            var req = s3.getObject({
                Bucket: options.bucket,
                Key: key
            });
            return req.createReadStream();

        },
        /**
         *
         * @param {string} fileKey
         * @param {Object.<string,*>} options
         * @return {stream.Writable}
         */
        createWriteStream: function (fileKey, options) {


            /**
             * @type {string}
             */
            var destinationKey = inputKey(fileKey);
            /**
             * @type {stream.Writable}
             */
            var writeStream = upload(destinationKey);

            /**
             *
             */
            var transcodeAfterUpload = function () {


                scheduleTranscoding(fileKey, function (err, data) {

                    /**
                     *
                     * @type {Date}
                     */
                    var end = new Date();

                    if (err) {
                        writeStream.emit("error", {msg: "transcoding error", detail: err});
                    } else {

                        writeStream.emit("stored", {
                            fileKey: fileKey,
                            storedAt: end
                        });
                    }
                });
            };
            writeStream.on("end", transcodeAfterUpload);
            return writeStream;

        },
        remove: function (fileKey, callback) {
            throw new Error("S3 storage adapter does not support the sync option");

            /**
             *
             * @type {{Bucket: string, Key: string}}
             */
            var params = {
                Bucket: options.bucket,
                Key: key
            };
            /**
             *
             * @type {AWS.Request}
             */
            s3.deleteObject(params, function (err, data) {
                if (err) {
                    // an error occurred
                    console.log(err, err.stack);
                }
                else {
                    console.log(data);           // successful response
                }
            });

        },
        watch: function () {
            throw new Error("S3 storage adapter does not support the sync option");
        }
    });
};