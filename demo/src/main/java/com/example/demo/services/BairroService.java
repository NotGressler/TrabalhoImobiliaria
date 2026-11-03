package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.demo.models.BairroModel;
import com.example.demo.repositories.BairroRepository;

@Service
public class BairroService {

    @Autowired
    private BairroRepository repository;

    public List<BairroModel> getAll() {
        List<BairroModel> list = repository.findAll();
        return list;
    }

    public Page<BairroModel> getAll(Pageable pageable) {
        Page<BairroModel> list = repository.findAll(pageable);
        return list;
    }

    public BairroModel find(Integer id) {
        Optional<BairroModel> model = repository.findById(id);
        return model.orElse(null);
    }

    public BairroModel insert(BairroModel model) {
        return repository.save(model);
    }
 
    public BairroModel update(BairroModel model) {
        try {
            if(find(model.getId())!=null){
                return repository.save(model);
            }
            return null;
        } catch (Exception e) {
            return null;
        }

    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

}
