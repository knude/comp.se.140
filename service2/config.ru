require 'net/http'
require 'rack'
require 'json'
require 'sys/filesystem'

class App
  START_TIME = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  STORAGE_URL = 'http://storage:5702'

  def call(env)
    req = Rack::Request.new(env)

    case req.path_info
    when '/status'
      begin
        timestamp = Time.now.utc.iso8601(0)
        
        uptime = uptime_hours
        
        free_space = root_space
        
        record = "#{timestamp}: uptime #{uptime_hours} hours, free disk in root: #{free_space} MBytes" # 5. Service2 analyses its status and creates the above-described record

        response = post(STORAGE_URL, '/log', { record: record }) # 6. Service2 sends the created record to Storage (HTTP POST Storage)

        write_log(record) # 7. Service2 writes the record to at the end of vStorage

        [200, { 'content-type' => 'text/plain' }, [record]] # 8. Service2 sends the record as a response to Service1. (text/plain)
      rescue => e
        [500, { 'content-type' => 'text/plain' }, ['Internal error']]
      end
    else
      [404, { 'content-type' => 'text/plain' }, ['Not found']]
    end
  end

  private

  def post(url, path, body)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    uri.path = path
    request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
    request.body = body.to_json
    response = http.request(request)
  end

  def write_log(record)
    File.write('/vStorage', "#{record}\n", mode: 'a+')
  end

  def root_space
    stat = Sys::Filesystem.stat('/')
    (stat.block_size * stat.blocks_free).to_f / (1024.0 * 1024.0)
  end

  def uptime_hours
    (Process.clock_gettime(Process::CLOCK_MONOTONIC) - START_TIME) / 3600.0
  end
end

run App.new
