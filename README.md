Meteor-cfs-transcoded-s3
========================

A CFS Storage Adapter that uploads the file to AWS S3 and transcodes it via the Elastic Transcoder


##Setup
- Create an S3 Bucket
- Create an Transcoding Pipeline
- Create IAM User with sufficient rights, for example: 
  - "Amazon Elastic Transcoder Jobs Submitter"
  - "Amazon S3 Full Access"

##Usage

###The Store
```
var transcodedS3 = new FS.Store.TranscodedS3("webVideos", {

    accessKeyId: "myAwsAccessKeyId",
    secretAccessKey: "myAwsSecretAccessKey",
    bucket: "myS3Bucket",
    region: "myRegion",
    presetId: "aElasticTranscoderPresetId", //for example "1351620000001-100070" for web videos
    pipelineId: "myElasticTrancoderPipelineId"


});
```
###The Collection
```
VideoFS = new FS.Collection("videoFS", {
    stores: [transcodedS3]
});
```
