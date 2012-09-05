%w{sinatra sinatra/json erb sass compass hashie}.each {|x| require x}

module MyProject
  class << self
    attr_accessor :config
  end
end

MyProject.config = Hashie::Mash.new(
  root: File.dirname(__FILE__)
)


configure do
  Compass.configuration do |config|
    config.project_path = MyProject.config.root
    config.sass_dir = 'views'
  end
end

set :haml, format: :html5
set :sass, Compass.sass_engine_options
set :scss, Compass.sass_engine_options

get '/styles.css' do
  content_type 'text/css', charset: 'utf-8'
  scss :styles
end

get '/' do
  erb :index
end

get '/test.json' do
  json a: 1
end