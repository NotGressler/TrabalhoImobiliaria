	package com.example.demo.services;
	
	import java.util.List;
	import java.util.Optional;
	
	import org.springframework.stereotype.Service;
	
	import com.example.demo.models.ImovelModel;
	import com.example.demo.repositories.ImovelRepository;
	
	@Service
	public class ImovelService {
	    private final ImovelRepository repository;
	
	    public ImovelService(ImovelRepository repository) {
	        this.repository = repository;
	    }
	
	    public List<ImovelModel> getAll() {
	        List<ImovelModel> list = repository.findAll();
	        return list;
	    }
	
	    public ImovelModel find(Integer id) {
	        Optional<ImovelModel> model = repository.findById(id);
	        return model.orElse(null);
	    }
	
	    public ImovelModel insert(ImovelModel model) {
	        return repository.save(model);
	    }
	 
	    public ImovelModel update(ImovelModel model) {
	        try {
	            if(find(model.getId())!=null){
	                return repository.save(model);
	            }
	            return null;
	        } catch (Exception e) {
	            return null;
	        }
	
	    }
	
	    @org.springframework.transaction.annotation.Transactional
	    public ImovelModel updateStatus(Integer id, String status) {
	        ImovelModel model = find(id);
	        if (model == null) return null;
	        model.setStatus(status);
	        return repository.save(model);
	    }

	    public void delete(Integer id) {
	        repository.deleteById(id);
	    }
	}
	
