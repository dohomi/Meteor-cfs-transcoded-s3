Package.describe({
    summary: "Storage adapter that uses AWS Elastic Transcoder to transcode and store files in S3"
});

Npm.depends({
    'aws-sdk': "2.0.0-rc9",
    "s3-write-stream": "0.0.1"
});


Package.on_use(function (api) {
    api.use(['cfs-base-package', 'cfs-storage-adapter']);
    api.add_files('transcodeds3.client.js', 'client');
    api.add_files('transcodeds3.server.js', 'server');

});

Package.on_test(function (api) {
//    api.use(['cfs-filesystem', 'test-helpers', 'tinytest'], 'server');
//    api.add_files('tests.js', 'server');
});
