// Summaries grounded in the project's source and README, not invented metrics.
export const stories = {
  shell: {goal:'A shell that gets the assignment.',build:'Java command parsing, built-ins, pipelines, redirection, and history.',detail:'The plot twist: pipes and redirects need separate parsing and execution.',flow:['Parse','Execute','Pipe'],label:'Systems challenge'},
  'http-server': {goal:'HTTP without the framework safety net.',build:'HTTP/1.1 over Java sockets, with file uploads, gzip, and a thread pool.',detail:'The plot twist: concurrent clients, persistent connections. No queue drama.',flow:['Request','Thread pool','Response'],label:'Systems challenge'},
  'dns-server': {goal:'Give domain names an address.',build:'Java DNS: packet parsing, query replies, recursive resolution.',detail:'The plot twist: decode the packet. Reply in fluent DNS.',flow:['Query','Resolve','Reply'],label:'Systems challenge'},
  'poly-learned-index': {goal:'A database side quest.',build:'A C++ DuckDB extension exploring polynomial learned indexes.',detail:'Still cooking. Extension builds and SQL tests included.',flow:['DuckDB','Extension','SQL tests'],label:'Research experiment'},
  'bug-tracker-10adnan75': {goal:'Give bugs somewhere to live.',build:'An issue tracker using MongoDB, Express, React, and Node.js.',detail:'Interface to database. Local setup in the repo.',flow:['React','Express','MongoDB'],label:'Web app'},
  'sorting-visualizer': {goal:'Make sorting less abstract.',build:'A browser-based visualization of sorting algorithms.',detail:'Watch values move. Compare time and space costs.',flow:['Values','Algorithm','Order'],label:'Learning tool'},
  'undergraduate-thesis': {goal:'Five stars. Suspicious energy.',build:'Group research: ML for fake Amazon reviews.',detail:'With Divit Shah, Rachit Shaha, and Samyak Jain. Analysis in the repo.',flow:['Reviews','Model','Prediction'],label:'Group research'},
  'speed-typing-test': {goal:'Keyboard warrior, meet receipts.',build:'A browser typing test that measures words per minute.',detail:'JavaScript. Type, measure, run it back.',flow:['Type','Measure','WPM'],label:'Web app'}
};
