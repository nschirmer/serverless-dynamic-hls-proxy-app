'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { Playlist, PlaylistTypeFilter, RenditionSortOrder, Chunklist, ChunklistPruneType } = require('dynamic-hls-proxy');
const express = require('express');
const sls = require('serverless-http');
const app = express();
app.get('/playlist_preview.m3u8', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const playlistUrl = req.query.uri;
    const playlistUrlParts = playlistUrl.split('/');
    playlistUrlParts.pop();
    const baseUrl = playlistUrlParts.join('/') + '/';
    const maxDuration = req.query.maxDuration || 30;
    return Playlist.loadFromUrl(playlistUrl).then(function (playlist) {
        playlist
            .setTypeFilter(PlaylistTypeFilter.VideoOnly)
            .sortByBandwidth(RenditionSortOrder.nonHdFirst)
            .setLimit(1)
            .setBaseUrl(baseUrl)
            .useDynamicChunklists(true)
            .setDynamicChunklistEndpoint('chunklist.m3u8')
            .setDynamicChunklistProperties({
            pruneType: ChunklistPruneType.preview,
            maxDuration: maxDuration
        });
        return res.status(200).type('application/x-mpegURL').send(playlist.toString());
    });
}));
app.get('/chunklist.m3u8', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    let baseUrl = req.query.baseUrl;
    const chunklistUri = req.query.uri;
    const chunklistUriParts = chunklistUri.split('/');
    chunklistUriParts.pop();
    const chunklistUrl = baseUrl + chunklistUri;
    if (chunklistUriParts.length > 0) {
        baseUrl += chunklistUriParts.join('/') + '/';
    }
    const pruneType = parseInt(req.query.pruneType, 10) || ChunklistPruneType.preview;
    const maxDuration = parseInt(req.query.maxDuration, 10) || 30;
    return Chunklist.loadFromUrl(chunklistUrl).then(function (chunklist) {
        chunklist
            .setBaseUrl(baseUrl)
            .setPruneType(pruneType)
            .setMaxDuration(maxDuration);
        return res.status(200).type('application/x-mpegURL').send(chunklist.toString());
    });
}));
module.exports.server = sls(app);
